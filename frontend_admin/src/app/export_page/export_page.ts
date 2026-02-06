import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../service/admin-data.service';

@Component({
  selector: 'app-export-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export_page.html',
  styleUrls: ['./export_page.css'],
})
export class ExportPageComponent {
  loading = false;
  message = '';

  constructor(private adminData: AdminDataService) {}

  private downloadJson(filename: string, data: unknown): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private getDateStamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  exportProducts(): void {
    this.runExport('products', () => this.adminData.getProducts());
  }

  exportCategories(): void {
    this.runExport('categories', () => this.adminData.getCategories());
  }

  exportCustomers(): void {
    this.runExport('customers', () => this.adminData.getCustomers());
  }

  exportUsers(): void {
    this.runExport('users', () => this.adminData.getUsers());
  }

  exportAuctions(): void {
    this.runExport('auctions', () => this.adminData.getAuctions());
  }

  exportBiddings(): void {
    this.runExport('biddings', () => this.adminData.getBiddings());
  }

  private runExport(label: string, fetcher: () => any): void {
    this.loading = true;
    this.message = '';
    fetcher().subscribe({
      next: (data: any) => {
        const payload = Array.isArray(data) ? data : data?.results ?? data;
        const filename = `export-${label}-${this.getDateStamp()}.json`;
        this.downloadJson(filename, payload);
        this.message = `Downloaded ${label} export.`;
      },
      error: () => {
        this.message = `Failed to export ${label}.`;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
