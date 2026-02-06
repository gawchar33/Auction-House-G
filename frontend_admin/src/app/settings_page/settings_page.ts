import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings_page.html',
  styleUrls: ['./settings_page.css'],
})
export class SettingsPageComponent {
  apiBase = 'http://127.0.0.1:8000/';
  message = '';

  openAdmin(): void {
    window.open('http://127.0.0.1:8000/admin/', '_blank');
  }

  clearCache(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.message = 'Local cache cleared.';
  }
}
