import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicInvoice } from './public-invoice';

describe('PublicInvoice', () => {
  let component: PublicInvoice;
  let fixture: ComponentFixture<PublicInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicInvoice],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
