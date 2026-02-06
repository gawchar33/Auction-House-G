import { Routes } from '@angular/router';

export const routes: Routes = [
  // unified auth page — uses the polished AuthComponent for login/register
  { path: 'auth', loadComponent: () => import('./auth.component').then((m) => m.AuthComponent) },
  { path: 'login', loadComponent: () => import('./auth.component').then((m) => m.AuthComponent) },
  { path: 'register', loadComponent: () => import('./auth.component').then((m) => m.AuthComponent) },

  // existing app routes
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    loadComponent: () => import('./product_list/product_list').then((m) => m.ProductListComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./user_list/user_list').then((m) => m.UserListComponent),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./category_list/category_list').then((m) => m.CategoryListComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customer_list/customer_list').then((m) => m.CustomerListComponent),
  },
  {
    path: 'auctions',
    loadComponent: () => import('./auction_list/auction_list').then((m) => m.AuctionListComponent),
  },
  {
    path: 'biddings',
    loadComponent: () => import('./bidding_list/bidding_list').then((m) => m.BiddingListComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile.component').then((m) => m.ProfileComponent),
  },
];
