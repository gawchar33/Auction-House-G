import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from './user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container">
    <h2>My Profile</h2>
    <div *ngIf="!profile">Loading...</div>
    <form *ngIf="profile" (ngSubmit)="save()">
      <label>Name</label>
      <input [(ngModel)]="profile.name" name="name" />

      <label>Email</label>
      <input [(ngModel)]="profile.email" name="email" />

      <label>Phone</label>
      <input [(ngModel)]="profile.phone" name="phone" />

      <div style="margin-top:12px">
        <button type="submit">Save</button>
      </div>
    </form>
    <div *ngIf="msg" style="margin-top:8px;color:green">{{msg}}</div>
  </div>
  `,
})
export class ProfileComponent {
  profile: any = null;
  msg = '';
  constructor(private us: UserService) { this.load(); }
  load() { this.us.getProfile().subscribe(p => { this.profile = p || {}; }); }
  save() {
    this.us.updateProfile(this.profile).subscribe({ next: () => { this.msg = 'Saved'; setTimeout(() => this.msg = '', 1500); }, error: () => { this.msg = 'Save failed'; } });
  }
}
