import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VehicleCard } from './components/VehicleCard';
import { ShowroomHero } from './components/ShowroomHero';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { ShowroomFilters } from './components/ShowroomFilters';
import { Vehicle, InventoryHealth, FilterState } from './types';

const mockVehicleInStock: Vehicle = {
  id: 'car-001',
  make: 'Tata',
  model: 'Nexon EV',
  category: 'Electric',
  price: 1450000,
  quantity: 4,
  year: 2025,
  kmsDriven: 18400,
  fuelType: 'Electric',
  city: 'Bengaluru',
  imageUrl: '/images/tata-nexon-ev.jpg',
  description: 'Connected electric compact SUV with confident city range.'
};

const mockVehicleSoldOut: Vehicle = {
  id: 'car-003',
  make: 'Hyundai',
  model: 'Verna',
  category: 'Sedan',
  price: 1599000,
  quantity: 0,
  year: 2024,
  kmsDriven: 41200,
  fuelType: 'Petrol',
  city: 'Delhi',
  imageUrl: '/images/hyundai-verna.jpg',
  description: 'Refined turbo sedan.'
};

const mockHealth: InventoryHealth = {
  models: 3,
  units: 6,
  value: 8647000,
  lowStock: 1,
  soldOut: 1
};

describe('Showroom VehicleCard', () => {
  it('renders accurate buyer-facing card metadata without exposing raw stock count', () => {
    const handleOpenDetails = vi.fn();
    const handlePurchase = vi.fn();

    render(
      <VehicleCard
        vehicle={mockVehicleInStock}
        isAdmin={false}
        onOpenDetails={handleOpenDetails}
        onPurchase={handlePurchase}
      />
    );

    // Make and Model
    expect(screen.getByText('Tata')).toBeInTheDocument();
    expect(screen.getByText('Nexon EV')).toBeInTheDocument();

    // Buyer-facing metadata
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('18,400 km')).toBeInTheDocument();
    expect(screen.getAllByText('Electric').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();

    // Availability status
    expect(screen.getByText('Certified · Ready to View')).toBeInTheDocument();

    // Raw internal stock count must NOT be shown to normal customers
    expect(screen.queryByText(/4 in stock/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin Stock/i)).not.toBeInTheDocument();

    // Price is formatted in INR
    expect(screen.getByText('₹14,50,000')).toBeInTheDocument();

    // Purchase button is enabled
    const buyButton = screen.getByRole('button', { name: /Buy/i });
    expect(buyButton).toBeEnabled();
    fireEvent.click(buyButton);
    expect(handlePurchase).toHaveBeenCalledWith(mockVehicleInStock);
  });

  it('disables purchase button and displays sold-out status when vehicle quantity is 0', () => {
    const handleOpenDetails = vi.fn();
    const handlePurchase = vi.fn();

    render(
      <VehicleCard
        vehicle={mockVehicleSoldOut}
        isAdmin={false}
        onOpenDetails={handleOpenDetails}
        onPurchase={handlePurchase}
      />
    );

    // Status shows Sold Out
    expect(screen.getAllByText('Sold Out').length).toBeGreaterThan(0);

    // Purchase button is disabled
    const buyButton = screen.getByRole('button', { name: /Sold Out/i });
    expect(buyButton).toBeDisabled();
    fireEvent.click(buyButton);
    expect(handlePurchase).not.toHaveBeenCalled();
  });

  it('exposes admin stock counts and controls only when isAdmin is true', () => {
    render(
      <VehicleCard
        vehicle={mockVehicleInStock}
        isAdmin={true}
        onOpenDetails={vi.fn()}
        onPurchase={vi.fn()}
        onEdit={vi.fn()}
        onRestock={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Admin operational controls visible
    expect(screen.getByText(/Admin Stock:/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

describe('ShowroomHero and Inventory Health visibility', () => {
  it('hides inventory health dashboard and total valuation from standard buyers', () => {
    render(<ShowroomHero isAdmin={false} health={mockHealth} />);

    expect(screen.queryByText(/Physical Units/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total Inventory Value/i)).not.toBeInTheDocument();
  });

  it('displays operational stock metrics only to administrators', () => {
    render(<ShowroomHero isAdmin={true} health={mockHealth} />);

    expect(screen.getByText(/Active Models/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Units/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Inventory Value/i)).toBeInTheDocument();
  });
});

describe('VehicleDetailModal', () => {
  it('displays complete vehicle specifications, inspection perks, and purchase action', () => {
    const handleClose = vi.fn();
    const handlePurchase = vi.fn();

    render(
      <VehicleDetailModal
        vehicle={mockVehicleInStock}
        onClose={handleClose}
        onPurchase={handlePurchase}
      />
    );

    // Header title
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Tata/i);

    // Specifications matrix
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Odometer')).toBeInTheDocument();
    expect(screen.getByText('Fuel')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();

    // Inspection perks
    expect(screen.getByText('160-Point Certified')).toBeInTheDocument();
    expect(screen.getByText('Non-Accidental Guarantee')).toBeInTheDocument();

    // Purchase button
    const purchaseBtn = screen.getByRole('button', { name: /Reserve & Purchase/i });
    expect(purchaseBtn).toBeEnabled();
    fireEvent.click(purchaseBtn);
    expect(handlePurchase).toHaveBeenCalledWith(mockVehicleInStock);

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close vehicle details/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('ShowroomFilters', () => {
  it('allows filtering by brand, fuel, category, budget, and KM-driven', () => {
    const handleChange = vi.fn();
    const handleReset = vi.fn();
    const filters: FilterState = {
      search: '',
      brand: '',
      category: '',
      fuel: '',
      maxPrice: '',
      modelYear: '',
      maxKm: '',
      sortBy: 'price_asc'
    };

    render(
      <ShowroomFilters
        filters={filters}
        onChange={handleChange}
        onReset={handleReset}
        vehicles={[mockVehicleInStock, mockVehicleSoldOut]}
        totalResults={2}
      />
    );

    // Search input
    const searchInput = screen.getByPlaceholderText(/Search by brand, model, city/i);
    fireEvent.change(searchInput, { target: { value: 'Nexon' } });
    expect(handleChange).toHaveBeenCalledWith({ search: 'Nexon' });

    // Brand filter
    const brandSelect = screen.getByLabelText(/Brand/i);
    fireEvent.change(brandSelect, { target: { value: 'Tata' } });
    expect(handleChange).toHaveBeenCalledWith({ brand: 'Tata' });

    // Fuel filter
    const fuelSelect = screen.getByLabelText(/Fuel Type/i);
    fireEvent.change(fuelSelect, { target: { value: 'Electric' } });
    expect(handleChange).toHaveBeenCalledWith({ fuel: 'Electric' });

    // Budget filter
    const budgetSelect = screen.getByLabelText(/Max Budget/i);
    fireEvent.change(budgetSelect, { target: { value: '2000000' } });
    expect(handleChange).toHaveBeenCalledWith({ maxPrice: '2000000' });

    // KM filter
    const kmSelect = screen.getByLabelText(/KM Driven/i);
    fireEvent.change(kmSelect, { target: { value: '30000' } });
    expect(handleChange).toHaveBeenCalledWith({ maxKm: '30000' });
  });
});
