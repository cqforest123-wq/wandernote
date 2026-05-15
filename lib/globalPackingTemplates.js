// Global packing templates for non-Chinese UI.
// Chinese UI keeps using SMART_PACKING in MemoScreen.js.
// 1.0 global scope: stable English templates first.
// Other UI languages temporarily use English templates to avoid showing Chinese content.

export const GLOBAL_PACKING_TEMPLATES = {
  'City Break': {
    emoji: '🏙️',
    desc: 'Urban sightseeing / museums / restaurants',
    groups: {
      '📋 Documents': [
        '🛂 Passport or ID',
        '📋 Visa / entry documents if required',
        '🏨 Hotel confirmation',
        '🎫 Return ticket',
      ],
      '💰 Money': [
        '💳 Credit card',
        '💵 Local cash',
        '📱 Mobile payment setup',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '📸 Camera',
      ],
      '👕 Clothing': [
        '👕 Daily outfits',
        '🧥 Light jacket',
        '👟 Comfortable walking shoes',
        '🩴 Slippers',
      ],
      '🧴 Toiletries': [
        '🧴 Toiletries',
        '💊 Basic medicine',
        '🌂 Compact umbrella',
        '🕶️ Sunglasses',
      ],
      '🎒 Special': [
        '🗺️ Offline maps',
        '📱 Offline translation app',
        '🔒 Luggage lock',
      ],
    },
  },

  'Island Vacation': {
    emoji: '🏝️',
    desc: 'Hawaii / Maldives / Bali / beach trips',
    groups: {
      '📋 Documents': [
        '🛂 Passport valid for 6+ months',
        '📋 Visa / e-visa confirmation',
        '🏨 Hotel confirmation',
        '🎫 Return ticket',
      ],
      '💰 Money': [
        '💳 Credit card',
        '💵 Local cash',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '📸 Waterproof camera / GoPro',
      ],
      '👕 Clothing': [
        '👙 Swimwear',
        '👕 Light summer clothes',
        '🩴 Beach sandals',
        '👟 Casual shoes',
        '🧥 Light jacket for air-conditioned places',
      ],
      '🧴 Toiletries': [
        '☀️ SPF50+ sunscreen',
        '🕶️ Polarized sunglasses',
        '💊 Motion sickness medicine',
        '🦟 Insect repellent',
        '💊 Basic medicine',
      ],
      '🎒 Special': [
        '🤿 Snorkeling gear',
        '🏄 Water activity reservation',
        '🌺 Waterproof bag',
        '💦 Moisturizing spray',
      ],
    },
  },

  'Road Trip': {
    emoji: '🚗',
    desc: 'US / Australia / Iceland ring roads',
    groups: {
      '📋 Documents': [
        '🛂 Passport',
        '🪪 Driver’s license',
        '📄 International driving permit / translation if needed',
        '📋 Car rental confirmation',
        '🎫 Return ticket',
      ],
      '💰 Money': [
        '💳 Credit card for rental deposit',
        '💵 Cash for remote areas',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '📸 Camera',
        '📡 Offline navigation',
      ],
      '👕 Clothing': [
        '👕 Daily clothes',
        '🧥 Windproof jacket',
        '👟 Sneakers',
        '🧢 Hat',
      ],
      '🧴 Toiletries': [
        '☀️ SPF50+ sunscreen',
        '🕶️ Sunglasses',
        '💊 Motion sickness medicine',
        '🩹 Band-aids',
        '🧴 Toiletries',
      ],
      '🎒 Special': [
        '⛽ Fill up before long drives',
        '🗺️ Download offline maps',
        '🥪 Snacks for long drives',
        '📦 Compression bags',
        '🔒 Luggage lock',
      ],
    },
  },

  'Outdoor Adventure': {
    emoji: '🏔️',
    desc: 'Alaska / Iceland / New Zealand hiking',
    groups: {
      '📋 Documents': [
        '🛂 Passport',
        '🪪 Driver’s license if renting a car',
        '📋 Accommodation / campsite confirmations',
        '🎫 Return ticket',
      ],
      '💰 Money': [
        '💳 Credit card',
        '💵 Emergency cash',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Large power bank',
        '📸 Camera',
        '📷 Tripod',
        '💾 Extra memory card',
      ],
      '👕 Clothing': [
        '🧥 Waterproof shell jacket',
        '🧣 Thermal base layers',
        '🧤 Waterproof gloves',
        '👢 Waterproof hiking boots',
        '🧦 Wool socks',
        '🧢 Warm hat',
      ],
      '🧴 Toiletries': [
        '☀️ Sunscreen for snow / high altitude',
        '💊 Altitude / motion sickness medicine',
        '💊 Cold medicine',
        '🩹 Waterproof band-aids',
        '🦟 Insect repellent',
      ],
      '🎒 Special': [
        '🗺️ Offline maps',
        '🌌 Aurora forecast app if relevant',
        '🧊 Insulated bottle',
        '⛽ Fuel planning for remote routes',
        '🧭 Emergency plan',
      ],
    },
  },

  'Business Trip': {
    emoji: '💼',
    desc: 'Meetings / conferences / site visits',
    groups: {
      '📋 Documents': [
        '🛂 Passport',
        '📋 Visa confirmation',
        '📋 Invitation letter / meeting confirmation',
        '🎫 Return ticket',
        '💊 Prescription proof if needed',
      ],
      '💰 Money': [
        '💳 Company credit card',
        '💳 Personal backup card',
        '💵 Local cash',
        '🧾 Receipt pouch',
      ],
      '📱 Electronics': [
        '💻 Laptop',
        '🔌 Multi-port charger',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '🖱️ Wireless mouse',
        '📊 Backup presentation files',
      ],
      '👕 Clothing': [
        '👔 Formal outfit',
        '👕 Business casual clothes',
        '👞 Dress shoes',
        '👟 Comfortable shoes',
        '🧥 Jacket',
      ],
      '🧴 Toiletries': [
        '🧴 Toiletries',
        '💊 Basic medicine',
        '😴 Eye mask and neck pillow',
        '🌂 Compact umbrella',
      ],
      '🎒 Special': [
        '🖊️ Business cards',
        '📋 Printed contracts / documents',
        '🔒 Luggage lock',
        '📦 Compression bags',
      ],
    },
  },


  'Honeymoon Trip': {
    emoji: '💍',
    desc: 'Romantic trips / resorts / anniversaries',
    groups: {
      '📋 Documents': [
        '🛂 Passport or ID',
        '📋 Visa / entry documents if required',
        '🏨 Hotel and resort confirmation',
        '🎫 Flight / train tickets',
        '💍 Marriage certificate copy if needed',
      ],
      '💰 Money': [
        '💳 Credit card',
        '💵 Local cash',
        '🧾 Booking receipts',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '📸 Camera',
        '🎧 Earbuds',
      ],
      '👕 Clothing': [
        '👗 Nice dinner outfit',
        '👔 Smart casual outfit',
        '👟 Comfortable shoes',
        '🩴 Resort sandals',
        '🧥 Light jacket',
      ],
      '🧴 Toiletries': [
        '🧴 Toiletries',
        '☀️ Sunscreen',
        '💊 Basic medicine',
        '🧴 Skincare',
        '🌹 Perfume / fragrance',
      ],
      '🎒 Special': [
        '🎁 Small surprise gift',
        '📷 Photo ideas / pose references',
        '🍽️ Restaurant reservations',
        '💆 Spa reservation',
        '🔒 Luggage lock',
      ],
    },
  },

  'Family Trip': {
    emoji: '👨‍👩‍👧',
    desc: 'Trips with children / parents / multi-generation travel',
    groups: {
      '📋 Documents': [
        '🛂 Passports or IDs for everyone',
        '📋 Visa / entry documents if required',
        '🏨 Hotel confirmation',
        '🎫 Tickets for all family members',
        '📄 Child travel documents if needed',
      ],
      '💰 Money': [
        '💳 Credit card',
        '💵 Local cash',
        '🧾 Receipt pouch',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '🎧 Kids headphones',
        '📱 Offline cartoons / games',
      ],
      '👕 Clothing': [
        '👕 Daily outfits',
        '🧥 Light jackets',
        '👟 Comfortable walking shoes',
        '🧢 Hats',
        '🧦 Extra socks',
      ],
      '🧴 Toiletries': [
        '☀️ Sunscreen',
        '🦟 Insect repellent',
        '💊 Kids medicine',
        '💊 Basic adult medicine',
        '🧻 Wet wipes / tissues',
      ],
      '🎒 Special': [
        '🍪 Snacks',
        '🧸 Comfort toy',
        '🍼 Child supplies if needed',
        '🗺️ Offline maps',
        '📋 Emergency contact list',
      ],
    },
  },

  'Budget Backpacking': {
    emoji: '🎒',
    desc: 'Hostels / long trips / lightweight budget travel',
    groups: {
      '📋 Documents': [
        '🛂 Passport',
        '📋 Visa / entry documents if required',
        '🏨 Hostel / accommodation confirmation',
        '🎫 Transport tickets',
        '📄 Travel insurance copy',
      ],
      '💰 Money': [
        '💳 Backup card',
        '💵 Small cash',
        '📱 Mobile payment setup',
        '🧾 Expense tracking app',
      ],
      '📱 Electronics': [
        '🔌 Universal adapter',
        '🔋 Power bank',
        '📱 Local SIM / eSIM',
        '🎧 Earbuds',
        '🔦 Small flashlight',
      ],
      '👕 Clothing': [
        '👕 Quick-dry shirts',
        '👖 Lightweight pants',
        '🧥 Packable jacket',
        '👟 Walking shoes',
        '🧦 Quick-dry socks',
      ],
      '🧴 Toiletries': [
        '🧴 Travel-size toiletries',
        '🧼 Laundry soap sheets',
        '💊 Basic medicine',
        '🩹 Band-aids',
        '🧻 Tissues',
      ],
      '🎒 Special': [
        '🔒 Padlock for hostel locker',
        '🎒 Daypack',
        '📦 Packing cubes',
        '🥤 Reusable water bottle',
        '🗺️ Offline maps',
      ],
    },
  },

  'Cruise Trip': {
    emoji: '🚢',
    desc: 'Cruises / island hopping / sea travel',
    groups: {
      '📋 Documents': [
        '🛂 Passport valid for 6+ months',
        '📋 Visa / cruise documents if required',
        '🚢 Cruise boarding pass',
        '🏨 Pre/post-cruise hotel confirmation',
        '🎫 Return ticket',
      ],
      '💰 Money': [
        '💳 Credit card linked to cruise account',
        '💵 Small cash for ports',
        '🧾 Travel insurance document',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank',
        '📱 Offline entertainment',
        '📸 Camera',
        '🎧 Earbuds',
      ],
      '👕 Clothing': [
        '👕 Casual daywear',
        '👗 Formal night outfit',
        '👙 Swimwear',
        '🩴 Pool sandals',
        '🧥 Light jacket for deck wind',
      ],
      '🧴 Toiletries': [
        '☀️ Sunscreen',
        '💊 Motion sickness medicine',
        '💊 Basic medicine',
        '🧴 Toiletries',
        '🕶️ Sunglasses',
      ],
      '🎒 Special': [
        '🧲 Magnetic hooks for cabin',
        '🪪 Lanyard for cruise card',
        '🧳 Small day bag for port days',
        '📋 Shore excursion reservations',
        '🔒 Luggage lock',
      ],
    },
  },

  'General International': {
    emoji: '🎒',
    desc: 'Universal checklist for most trips',
    groups: {
      '📋 Documents': [
        '🛂 Passport valid for 6+ months',
        '📋 Visa confirmation',
        '📋 Hotel / itinerary confirmation',
        '🎫 Return ticket',
        '💊 Prescription proof if needed',
      ],
      '💰 Money': [
        '💳 Credit card plus backup card',
        '💵 Local cash',
        '📱 Mobile payment setup',
      ],
      '📱 Electronics': [
        '🔌 Travel adapter',
        '🔋 Power bank under airline limit',
        '📱 Local SIM / eSIM',
        '📸 Camera',
        '💾 Backup storage',
      ],
      '👕 Clothing': [
        '👕 Clothes for trip length + 1 day',
        '👙 Swimwear if needed',
        '🧥 Jacket',
        '👟 Comfortable shoes',
        '🩴 Slippers',
      ],
      '🧴 Toiletries': [
        '🧴 Toiletries',
        '☀️ Sunscreen',
        '💊 Basic medicine',
        '🩹 Band-aids',
        '🌂 Compact umbrella',
      ],
      '🎒 Special': [
        '🔒 Luggage lock',
        '📦 Compression bags',
        '🛍️ Reusable shopping bag',
        '🗺️ Offline maps',
      ],
    },
  },
};
