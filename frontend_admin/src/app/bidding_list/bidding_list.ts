import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bidding-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './bidding_list.html',
  styleUrls: ['./bidding_list.css'],
})
export class BiddingListComponent implements OnInit {
  biddings: any[] = [];
  loading = false;
  error = '';

  inflight = false;

  // add form
  showAdd = false;
  addModel: any = { auction: null, amount: 0 };
  addError = '';

  // edit
  editing = false;
  editModel: any = null;
  editError = '';

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadBiddings();
  }

  private consumeEvent(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch (e) {}
  }

  loadBiddings(ev?: Event): void {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    this.error = '';
    this.adminData.getBiddings().subscribe({
      next: (data: any) => {
        this.biddings = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          this.loading = false;
          this.inflight = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load biddings (${err.status})` : 'Failed to load biddings.';
        console.error(err);
        this.loading = false;
        this.inflight = false;
      },
      complete: () => {
        this.loading = false;
        this.inflight = false;
      },
    });
  }

  toggleAdd(ev?: Event) {
    this.consumeEvent(ev);
    this.showAdd = !this.showAdd;
    this.addError = '';
    if (!this.showAdd) this.addModel = { auction: null, amount: 0 };
  }

  submitAdd(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.addError = '';
    if (!this.addModel.auction || !this.addModel.amount) { this.addError = 'Auction and amount required'; return; }
    this.inflight = true;
    this.adminData.createBidding(this.addModel).subscribe({
      next: () => { this.toggleAdd(); this.loadBiddings(); },
      error: (err) => { this.inflight = false; this.addError = err && err.message ? err.message : 'Failed to create bid.'; console.error('[BiddingList] create error', err); }
    });
  }

  startEdit(item: any, ev?: Event) {
    this.consumeEvent(ev);
    this.editing = true;
    this.editError = '';
    this.editModel = Object.assign({}, item);
  }

  cancelEdit(ev?: Event) {
    this.consumeEvent(ev);
    this.editing = false;
    this.editModel = null;
    this.editError = '';
  }

  submitEdit(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    if (!this.editModel || !this.editModel.id) { this.editError = 'No item selected'; return; }
    this.inflight = true;
    const id = this.editModel.id;
    const payload = { amount: this.editModel.amount };
    this.adminData.updateBidding(id, payload).subscribe({
      next: () => { this.cancelEdit(); this.loadBiddings(); this.inflight = false; },
      error: (err) => { this.inflight = false; this.editError = err && err.message ? err.message : 'Failed to update bid.'; console.error('[BiddingList] update error', err); }
    });
  }

  deleteItem(item: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this bid?')) return;
    const id = item && item.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteBidding(id).subscribe({
      next: () => { this.loadBiddings(); this.inflight = false; },
      error: (err) => { this.inflight = false; console.error('[BiddingList] delete error', err); alert('Failed to delete bid.'); }
    });
  }
}
