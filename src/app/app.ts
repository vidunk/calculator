import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

type Theme = 'dark' | 'light';
type Op = 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'pow' | 'pct' | 'sqrt';

interface HistoryItem {
  expr: string;
  result: string;
}

@Component({
  imports: [RouterOutlet, FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('app1');

  a: number | null = null;
  b: number | null = null;
  c: string = '';
  isError = false;
  copied = false;
  history: HistoryItem[] = [];
  theme: Theme = 'dark';

  constructor() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        this.theme = saved;
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        this.theme = 'light';
      }
    } catch {
      /* storage or matchMedia unavailable, keep default */
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', this.theme);
    } catch {}
  }

  /* ---------- helpers ---------- */
  private fail(message: string) {
    this.c = message;
    this.isError = true;
  }

  private tidy(n: number): string {
    // removes floating point noise, e.g. 0.1 + 0.2 -> 0.3
    return String(Number(n.toPrecision(12)));
  }

  /* ---------- main calculation ---------- */
  calc(op: Op) {
    this.copied = false;
    const needsB = op !== 'sqrt';

    if (this.a === null || (needsB && this.b === null)) {
      this.fail(needsB ? 'Enter both values' : 'Enter the first value');
      return;
    }

    const x = this.a;
    const y = this.b as number;
    let r: number;
    let expr: string;

    switch (op) {
      case 'add':
        r = x + y;
        expr = `${x} + ${y}`;
        break;
      case 'sub':
        r = x - y;
        expr = `${x} − ${y}`;
        break;
      case 'mul':
        r = x * y;
        expr = `${x} × ${y}`;
        break;
      case 'div':
        if (y === 0) return this.fail('Cannot divide by zero');
        r = x / y;
        expr = `${x} ÷ ${y}`;
        break;
      case 'mod':
        if (y === 0) return this.fail('Cannot divide by zero');
        r = x % y;
        expr = `${x} mod ${y}`;
        break;
      case 'pow':
        r = Math.pow(x, y);
        expr = `${x} ^ ${y}`;
        break;
      case 'pct':
        r = (x / 100) * y;
        expr = `${x}% of ${y}`;
        break;
      case 'sqrt':
        if (x < 0) return this.fail('No square root of a negative');
        r = Math.sqrt(x);
        expr = `√${x}`;
        break;
    }

    if (!Number.isFinite(r)) {
      this.fail('Result is out of range');
      return;
    }

    this.isError = false;
    this.c = this.tidy(r);
    this.history = [{ expr, result: this.c }, ...this.history].slice(0, 10);
  }

  /* ---------- extra actions ---------- */
  swap() {
    [this.a, this.b] = [this.b, this.a];
  }

  clear() {
    this.a = null;
    this.b = null;
    this.c = '';
    this.isError = false;
    this.copied = false;
  }

  useResult() {
    if (this.c === '' || this.isError) return;
    this.a = Number(this.c);
    this.b = null;
    this.c = '';
    this.copied = false;
  }

  async copy() {
    if (this.c === '' || this.isError) return;
    try {
      await navigator.clipboard.writeText(this.c);
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  reuse(item: HistoryItem) {
    this.a = Number(item.result);
    this.b = null;
    this.c = item.result;
    this.isError = false;
  }

  clearHistory() {
    this.history = [];
  }
}
