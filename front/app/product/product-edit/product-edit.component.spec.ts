import { TestBed, inject } from '@angular/core/testing';

import { ProductEditComponent } from './product-edit.component';

describe('a product-edit component', () => {
	let component: ProductEditComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ProductEditComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([ProductEditComponent], (ProductEditComponent) => {
		component = ProductEditComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});