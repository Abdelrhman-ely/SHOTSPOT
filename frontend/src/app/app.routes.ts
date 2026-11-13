import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Planner } from './pages/planner/planner';
import { About } from './pages/about/about';

export const routes: Routes = [
  { path: '', component: Home, title: 'SHOTSPOT — Lunar Landing Planner' },
  { path: 'planner', component: Planner, title: 'Planner · SHOTSPOT' },
  { path: 'about', component: About, title: 'Assumptions & limits · SHOTSPOT' },
  { path: 'plan/:section', redirectTo: ({ params }) => `/planner#${params['section']}` },
  { path: '**', redirectTo: '' },
];
