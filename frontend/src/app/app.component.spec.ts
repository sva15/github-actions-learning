import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [AppComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toEqual('Simple Angular App');
  });

  it('should increment count on button click', () => {
    const initialCount = component.count;
    component.increment();
    expect(component.count).toBe(initialCount + 1);
  });

  it('should update name when input changes', () => {
    const testName = 'John Doe';
    const input = fixture.nativeElement.querySelector('input');
    input.value = testName;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.name).toBe(testName);
  });
});