// Trade definitions with pastel colors, icons, and preset common skills

export const TRADES = [
  {
    id: 'electrician',
    name: 'Electrician',
    icon: '⚡',
    colorKey: 'butter',
    color: '#fbf0c9',
    borderColor: '#e8db9c',
    darkColor: '#3d3822',
    darkBorder: '#615a39',
    description: 'Wiring, fixtures, repair & installations',
    skills: [
      'House Wiring & Conduit',
      'Fan & Light Fitting',
      'MCB & Switchboard Repair',
      'Appliance Installation',
      'Inverter & Battery Setup',
      'Short Circuit Troubleshooting'
    ]
  },
  {
    id: 'plumber',
    name: 'Plumber',
    icon: '🔧',
    colorKey: 'sky',
    color: '#d8e9fb',
    borderColor: '#b4d4f7',
    darkColor: '#24374b',
    darkBorder: '#395370',
    description: 'Pipes, leaks, fittings & water pumps',
    skills: [
      'Pipe Leakage Repair',
      'Tap & Shower Fitting',
      'Water Tank Cleaning & Setup',
      'Drainage & Clog Clearing',
      'Bathroom Sanitary Fitting',
      'Motor & Pump Connection'
    ]
  },
  {
    id: 'mason',
    name: 'Mason',
    icon: '🧱',
    colorKey: 'peach',
    color: '#fde4d6',
    borderColor: '#f4c7ab',
    darkColor: '#473227',
    darkBorder: '#6d4f40',
    description: 'Brickwork, plastering, tiles & concrete',
    skills: [
      'Brick & Block Laying',
      'Wall Plastering & Putty',
      'Tile & Marble Laying',
      'Concrete Mixing & Casting',
      'Waterproofing & Grouting',
      'Floor & Slab Levelling'
    ]
  },
  {
    id: 'technician',
    name: 'Technician',
    icon: '🛠️',
    colorKey: 'lilac',
    color: '#e4dcf7',
    borderColor: '#cdbef0',
    darkColor: '#362f49',
    darkBorder: '#544972',
    description: 'ACs, appliances, CCTV & electronics',
    skills: [
      'AC Servicing & Gas Refill',
      'Refrigerator & Washing Machine',
      'CCTV Camera Installation',
      'TV & Sound System Mounting',
      'Solar Panel Maintenance',
      'Electronic Board Troubleshooting'
    ]
  },
  {
    id: 'driver',
    name: 'Driver',
    icon: '🚗',
    colorKey: 'mint',
    color: '#d3efe3',
    borderColor: '#aae1c7',
    darkColor: '#233d32',
    darkBorder: '#375d4d',
    description: 'Cars, commercial cabs, heavy trucks',
    skills: [
      'Commercial Cab Driving',
      'Personal Car Chauffeur',
      'Highway & Night Driving',
      'Heavy Goods Vehicle Driving',
      'Routine Fluid & Tyre Check',
      'City GPS Navigation'
    ]
  },
  {
    id: 'delivery',
    name: 'Delivery Staff',
    icon: '📦',
    colorKey: 'coral',
    color: '#fce1db',
    borderColor: '#f7c2b5',
    darkColor: '#462e2a',
    darkBorder: '#6e4a44',
    description: 'Parcels, food, packages & dispatch',
    skills: [
      'Parcel & Package Delivery',
      'Food & Grocery Courier',
      'Two-Wheeler Navigation',
      'Cash On Delivery Handling',
      'Same-Day Express Dispatch',
      'Fragile Item Handling'
    ]
  },
  {
    id: 'machine-operator',
    name: 'Machine Operator',
    icon: '⚙️',
    colorKey: 'slate',
    color: '#e2ebee',
    borderColor: '#c0d4dc',
    darkColor: '#29373d',
    darkBorder: '#42555e',
    description: 'Factory equipment, lathes & plant machinery',
    skills: [
      'CNC Machine Operation',
      'Lathe & Milling Machine',
      'Assembly Line Production',
      'Machine Maintenance & Oiling',
      'Workplace Safety & Hazard Checks',
      'Finished Goods Quality Inspection'
    ]
  }
];

export const AVAILABILITY_OPTIONS = [
  { id: 'Full time', label: 'Full time' },
  { id: 'Part time', label: 'Part time' },
  { id: 'Weekends', label: 'Weekends only' }
];

export function getTradeByName(name) {
  if (!name) return TRADES[0];
  const found = TRADES.find(t => t.name.toLowerCase() === name.toLowerCase());
  return found || TRADES[0];
}
