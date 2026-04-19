import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ck-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="ck-auth">
      <div class="ck-auth__card">
        <div class="ck-auth__logo">
          <img src="assets/logo.png" alt="ClinicKit" />
          <h1>ClinicKit</h1>
        </div>
        <h2>Welcome back</h2>
        <p class="ck-auth__sub">Sign in to your clinic dashboard.</p>
        <form class="ck-auth__form">
          <label>Email</label>
          <input type="email" placeholder="you@clinic.com" />
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
          <a routerLink="/dashboard" class="ck-auth__btn">Sign In</a>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ck-auth {
      min-height: 100vh;
      background: #FAF7F2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .ck-auth__card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }
    .ck-auth__logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
      h1 { font-size: 1.4rem; font-weight: 700; color: #C41E3A; margin: 0; }
    }
    h2 { font-size: 1.4rem; font-weight: 700; margin: 0 0 6px; color: #1a1a2e; }
    .ck-auth__sub { color: #888; margin: 0 0 24px; font-size: 14px; }
    .ck-auth__form {
      display: flex; flex-direction: column; gap: 10px;
      label { font-size: 13px; font-weight: 600; color: #555; }
      input {
        border: 1.5px solid #e8e8e8; border-radius: 8px;
        padding: 10px 14px; font-size: 14px; outline: none;
        &:focus { border-color: #C41E3A; }
      }
    }
    .ck-auth__btn {
      margin-top: 8px;
      display: block;
      text-align: center;
      padding: 12px;
      background: #C41E3A;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      transition: background 0.2s;
      &:hover { background: #8B1A2B; }
    }
  `]
})
export class LoginComponent {}
