import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>Welcome to {{ title }}!</h1>
    <input [(ngModel)]="name" placeholder="Enter your name">
    <p *ngIf="name">Hello, {{ name }}!</p>
    <button (click)="increment()">Click Count: {{ count }}</button>
  `,
  styles: [`
    h1 { color: #369; font-family: Arial, Helvetica, sans-serif; }
    button { padding: 5px 10px; margin-top: 10px; }
  `]
})
export class AppComponent {
  title = 'Simple Angular App';
  name = '';
  count = 0;

  increment() {
    this.count++;
  }
}