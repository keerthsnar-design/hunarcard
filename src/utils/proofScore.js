// Calculation of Skill Proof Level (0 to 100) based on transparent, honest rules.
// Rule-based score, not AI. It shows how much proof this card has.

export function calculateProofScore(card, photos = [], vouches = []) {
  if (!card) {
    return {
      total: 0,
      level: 'Getting started',
      breakdown: {
        tradeExp: 0,
        skills: 0,
        photos: 0,
        vouches: 0,
        areaAvailability: 0
      },
      nextStep: 'Next step: set your trade and experience (+10 points).'
    };
  }

  // Rule 1: 10 points for trade and years of experience
  const hasTrade = Boolean(card.trade && card.trade.trim());
  const hasExp = card.years_experience !== undefined && card.years_experience !== null && card.years_experience >= 0;
  const tradeExpPoints = (hasTrade && hasExp) ? 10 : 0;

  // Rule 2: 5 points per listed skill, maximum 20
  const skillsCount = Array.isArray(card.skills) ? card.skills.length : 0;
  const skillsPoints = Math.min(20, skillsCount * 5);

  // Rule 3: 10 points per work photo with a caption, maximum 30
  const safePhotos = Array.isArray(photos) ? photos : [];
  const captionedPhotosCount = safePhotos.filter(p => p && p.caption && p.caption.trim().length > 0).length;
  const photosPoints = Math.min(30, captionedPhotosCount * 10);

  // Rule 4: 10 points per vouch from a different person, maximum 30
  const safeVouches = Array.isArray(vouches) ? vouches : [];
  // Ensure unique user_id for vouches
  const uniqueVoucherIds = new Set(safeVouches.map(v => v.user_id || v.id).filter(Boolean));
  const vouchesCount = uniqueVoucherIds.size;
  const vouchesPoints = Math.min(30, vouchesCount * 10);

  // Rule 5: 10 points if area and availability are set
  const hasArea = Boolean(card.area && card.area.trim().length > 0);
  const hasAvailability = Boolean(card.availability && card.availability.trim().length > 0);
  const areaAvailabilityPoints = (hasArea && hasAvailability) ? 10 : 0;

  const total = tradeExpPoints + skillsPoints + photosPoints + vouchesPoints + areaAvailabilityPoints;

  // Levels: 0 to 39 'Getting started', 40 to 69 'Building trust', 70 to 100 'Well proven'
  let level = 'Getting started';
  let levelColor = 'var(--pastel-peach)';
  let levelTextColor = '#59321f';

  if (total >= 70) {
    level = 'Well proven';
    levelColor = 'var(--pastel-mint)';
    levelTextColor = '#1b4a33';
  } else if (total >= 40) {
    level = 'Building trust';
    levelColor = 'var(--pastel-sky)';
    levelTextColor = '#1f3c59';
  }

  // Friendly next-step tip for My Card
  let nextStep = '';
  if (total >= 100) {
    nextStep = 'Your card is 100% complete! Wonderful work, you have full proof.';
  } else if (tradeExpPoints < 10) {
    nextStep = 'Next step: add your trade and years of experience (+10 points).';
  } else if (areaAvailabilityPoints < 10) {
    nextStep = 'Next step: set your town area and work availability (+10 points).';
  } else if (skillsPoints < 20) {
    const needed = Math.ceil((20 - skillsPoints) / 5);
    nextStep = `Next step: check ${needed} more skill${needed > 1 ? 's' : ''} you can do (+${20 - skillsPoints} points).`;
  } else if (photosPoints < 30) {
    nextStep = 'Next step: add a photo of work you are proud of with a caption (+10 points).';
  } else if (vouchesPoints < 30) {
    nextStep = 'Next step: share your card with a past customer or colleague for a vouch (+10 points).';
  }

  return {
    total,
    level,
    levelColor,
    levelTextColor,
    nextStep,
    breakdown: {
      tradeExp: tradeExpPoints,
      skills: skillsPoints,
      photos: photosPoints,
      vouches: vouchesPoints,
      areaAvailability: areaAvailabilityPoints
    }
  };
}
