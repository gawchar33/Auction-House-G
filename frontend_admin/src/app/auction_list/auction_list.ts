import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auction-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './auction_list.html',
  styleUrls: ['./auction_list.css'],
})
export class AuctionListComponent implements OnInit {
  auctions: any[] = [];
  loading = false;
  error = '';

  inflight = false;

  // add form state
  showAdd = false;
  addModel: any = { title: '', description: '', starting_price: 0, category: null, product: null, start_time: null, end_time: null };
  addError = '';

  // edit state
  editing = false;
  editModel: any = null;
  editError = '';

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadAuctions();
  }

  private consumeEvent(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch (e) {}
  }

  loadAuctions(ev?: Event): void {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    this.error = '';
    this.adminData.getAuctions().subscribe({
      next: (data: any) => {
        this.auctions = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          this.loading = false;
          this.inflight = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load auctions (${err.status})` : 'Failed to load auctions.';
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
    if (!this.showAdd) this.addModel = { title: '', description: '', starting_price: 0, category: null, product: null, start_time: null, end_time: null };
  }

  submitAdd(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.addError = '';
    if (!this.addModel.title) { this.addError = 'Title required'; return; }
    this.inflight = true;
    this.adminData.createAuction(this.addModel).subscribe({
      next: () => { this.toggleAdd(); this.loadAuctions(); },
      error: (err) => { this.inflight = false; this.addError = err && err.message ? err.message : 'Failed to create auction.'; console.error('[AuctionList] create error', err); }
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
    const payload = { title: this.editModel.title, description: this.editModel.description, starting_price: this.editModel.starting_price, is_active: this.editModel.is_active };
    this.adminData.updateAuction(id, payload).subscribe({
      next: () => { this.cancelEdit(); this.loadAuctions(); this.inflight = false; },
      error: (err) => { this.inflight = false; this.editError = err && err.message ? err.message : 'Failed to update auction.'; console.error('[AuctionList] update error', err); }
    });
  }

  deleteItem(item: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this auction?')) return;
    const id = item && item.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteAuction(id).subscribe({
      next: () => { this.loadAuctions(); this.inflight = false; },
      error: (err) => { this.inflight = false; console.error('[AuctionList] delete error', err); alert('Failed to delete auction.'); }
    });
  }
}
