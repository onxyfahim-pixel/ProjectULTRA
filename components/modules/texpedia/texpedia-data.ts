import {
  TexpediaPost,
  TexpediaCategory,
} from '@/lib/types/modules';

export const TEXPEDIA_CATEGORY_CONFIG: Record<
  TexpediaCategory,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  FABRIC_WEAVING: {
    label: 'Fabric & Weaving',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    desc: 'Yarn counts, knit loops, warp/weft tension, barre & elastane recovery',
  },
  DYEING_WASHING: {
    label: 'Dyeing & Wet Process',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    desc: 'Metamerism, enzyme washing, shade banding, wash fastness & PH',
  },
  CUTTING_PATTERN: {
    label: 'Cutting & Pattern',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Marker efficiency, fabric bowing, grain line alignment & notch accuracy',
  },
  SEWING_MACHINERY: {
    label: 'Sewing & Machinery',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    desc: 'Needle heat, SPI calibration, looper timings, puckering & feed dog adjustments',
  },
  FINISHING_PACKING: {
    label: 'Finishing & Packing',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Steam press shine, carton drop tests, moisture limits & barcode scanning',
  },
  QUALITY_AUDIT: {
    label: 'Quality & AQL Standards',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'ASTM 4-point grading, AQL 1.5/2.5 statistical sampling, DHU root cause',
  },
  TECHNICAL_TIPS: {
    label: 'Floor Hacks & Tips',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    desc: 'Quick fixes, mechanic guides, workstation ergonomics & safety tricks',
  },
};

export const INITIAL_TEXPEDIA_POSTS: TexpediaPost[] = [
  {
    id: 'post-001',
    title: 'Solving Seam Puckering on 100% Polyester Microfiber (Activewear Seams)',
    category: 'SEWING_MACHINERY',
    tags: ['Needle Heat', 'Seam Puckering', 'Activewear', 'Thread Tension', 'Microfiber'],
    summary:
      'High-speed sewing on dense 75D polyester microfiber caused severe structural puckering. Here is how switching needle point and looper tension completely cured the issue.',
    content:
      `### Problem Statement
During production of 45,000 units of moisture-wicking running tees for Decathlon, Sewing Line 04 experienced a 6.8% defect rate due to puckering along the side seams and raglan sleeves. The fabric is 100% polyester interlock (140 GSM, 75D/72F microfilament).

### Root Cause Analysis (Ishikawa)
1. **Needle Penetration Heat**: Standard R-point needles (size 75/11) generated frictional heat exceeding 240°C at 4,800 RPM, melting microfilaments inside the stitch channel.
2. **Excessive Thread Tension**: High needle thread tension caused elastic elongation during stitch formation, which contracted after releasing from the presser foot.
3. **Feed Dog Tooth Pitch**: Standard coarse feed dogs bruised the filament structure.

### Permanent Floor Fix
- Switched needle to **Groz-Beckert SAN 10 XS (Extra Slim Ball Point, Size 65/9 with Teflon/Titanium Nitride coating)**.
- Reduced machine speed from 4,800 RPM to 3,900 RPM.
- Loosened upper thread tension by 35% and replaced standard polyester sewing thread with **Corespun Polyester/Polyester 120 Ticket**.
- Adjusted differential feed ratio to 1:1.05 to slightly gather rather than stretch.

### Result
Seam puckering fell from 6.8% to 0.2% on final inspection. Seam strength passed buyer spec at 180N elongation test.`,
    author: {
      name: 'Engr. Zahidul Hassan',
      role: 'Senior Industrial Engineer & Technical Trainer',
      department: 'Production Engineering',
      badges: ['Master Mechanic', 'Verified Contributor'],
    },
    images: [
      {
        id: 'img-1a',
        url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80',
        caption: 'Defect: Severe seam puckering along side seam caused by excessive needle friction and high thread tension (R-point 75/11).',
        highlightDefect: true,
      },
      {
        id: 'img-1b',
        url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
        caption: 'Solution: Perfectly flat, ripple-free activewear seam achieved after switching to SAN 10 XS 65/9 Titanium needle and corespun thread.',
        highlightDefect: false,
      },
      {
        id: 'img-1c',
        url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
        caption: 'Machine Setting: Dial gauge set to 1:1.05 differential feed ratio on Juki 4-thread overlock workstation.',
        highlightDefect: false,
      },
    ],
    upvotesCount: 38,
    hasUpvoted: false,
    isBookmarked: true,
    isVerifiedSolution: true,
    viewsCount: 412,
    createdAt: '2026-09-24 10:15',
    comments: [
      {
        id: 'cmt-1',
        authorName: 'Farhana Akhter',
        authorRole: 'Lab Quality Manager',
        department: 'Testing Lab',
        timestamp: '2026-09-24 11:30',
        content: 'Excellent case study Zahidul bhai! We also noticed wash shrinkage on puckered seams was 2.5% higher before this needle change.',
        likesCount: 6,
      },
      {
        id: 'cmt-2',
        authorName: 'Mohammad Rafiq',
        authorRole: 'Line 04 Supervisor',
        department: 'Sewing Section',
        timestamp: '2026-09-24 14:02',
        content: 'Applied on Line 04 yesterday; operator comfort improved noticeably because fabric feeds smoothly without pushing.',
        likesCount: 4,
      },
    ],
  },
  {
    id: 'post-002',
    title: 'Eliminating Metamerism & Shading in Heather Grey Cotton/Poly Fleece',
    category: 'DYEING_WASHING',
    tags: ['Metamerism', 'Spectrophotometer', 'Heather Grey', 'D65 Light', 'Dye Shading'],
    summary:
      'Fabric rolls matched perfectly in the factory daylight booth (D65) but showed severe color mismatch under store lighting (TL84 / Store Fluorescent). Here is the optical solution.',
    content:
      `### Overview of Defect
During cutting inspection of 60% Cotton / 40% Polyester blended brushed fleece (320 GSM, Heather Grey Melange), fabric inspectors observed consistent panel-to-panel color shading when garments were evaluated inside the buyer's store simulation cabinet.

### Investigation
- Under standard daylight (CIE D65), Delta-E was within tolerance at **0.45**.
- Under buyer retail store lighting (TL84 / CWF), Delta-E jumped to **1.62**, causing collar rib and body panels to look distinctly two-toned (metameric failure).
- **Spectrophotometric Curve Analysis**: The dye formulation used for the polyester portion contained disperse yellow with a secondary absorption peak at 440nm, differing from the black fiber melange blend.

### Resolution Protocol
1. **Dye Dyestuff Reformulation**: Replaced the trichromatic dye combination with CI Disperse Blue 56 and CI Disperse Brown 1 with flat reflectance curve across 400-700nm.
2. **Dual-Illuminant Pass Criteria**: Standard operating procedure amended so that incoming batches must pass Delta-E < 0.8 under BOTH D65 and TL84 illuminants.
3. **Roll Segregation**: Implemented QR-barcode tagging indicating dye-lot batch pairing.

### Practical Factory Tip
Never cut rib collars from a different batch roll than the garment body, even if Delta-E appears low under ambient daylight!`,
    author: {
      name: 'Dr. Tanzim Ahmed',
      role: 'QA General Manager & Colorist',
      department: 'Central Quality Lab',
      badges: ['ISO 17025 Lead Auditor', 'Textile Colorist'],
    },
    images: [
      {
        id: 'img-2a',
        url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
        caption: 'Defect: Noticeable two-tone shading between body panel and collar under TL84 store lighting (Metameric mismatch).',
        highlightDefect: true,
      },
      {
        id: 'img-2b',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
        caption: 'Spectrophotometer Macbeth light booth verification under calibrated D65, TL84, and Illuminant A.',
        highlightDefect: false,
      },
    ],
    upvotesCount: 45,
    hasUpvoted: true,
    isBookmarked: true,
    isVerifiedSolution: true,
    viewsCount: 520,
    createdAt: '2026-09-22 16:45',
    comments: [
      {
        id: 'cmt-3',
        authorName: 'Salma Khatun',
        authorRole: 'Cutting Master',
        department: 'Cutting Room',
        timestamp: '2026-09-23 09:12',
        content: 'This protocol saved our entire Zara order. We now check every roll with the handheld Datacolor spectrophotometer before spreading.',
        likesCount: 8,
      },
    ],
  },
  {
    id: 'post-003',
    title: 'Preventing Pocket Bag Abrasion & Hole Damage During Denim Enzyme Stone Wash',
    category: 'DYEING_WASHING',
    tags: ['Denim Washing', 'Enzyme Wash', 'Pumice Stone', 'Pocket Lining', 'Abrasion Fix'],
    summary:
      'Lightweight poplin pocket bags were developing edge fraying and holes during a 45-minute enzyme stone wash cycle. Here is the pocket lining reinforcement and wash parameter fix.',
    content:
      `### Problem Description
Style STY-DN-502 (Slim Fit Men's 12oz Denim) undergoes a vintage heavy stone wash cycle. Out of 1,200 pcs washed in the first production trial, 82 garments suffered pocket bag lining tears and hole punctures near the bottom corner rivets.

### Root Causes
1. **Pocket Lining Fabric Strength**: The pocket lining specified was 65/35 TC poplin (110 GSM), with inadequate wet tensile burst strength (under 80 kPa).
2. **Pumice Stone Particle Size**: Pumice stones had degraded into sharp gravel shards under 1.5 cm diameter which lodged inside the unbuttoned pocket openings.
3. **Washer Drum RPM**: Mechanical action speed was 28 RPM, generating excessive kinetic impact.

### Implemented Solutions
- **Temporary Pocket Tack Seam**: In sewing, a single-chain temporary tack stitch (6 SPI) was introduced to close the front pocket scoop before washing. This prevents stones from entering the bag.
- **Pumice Stone Screening**: Instituted mandatory stone tumbling screening—all stones smaller than 3.0 cm diameter are discarded daily.
- **Enzyme Chemistry**: Replaced 30% of physical pumice stone load with high-activity neutral cellulase enzyme (Denimax), reducing wash cycle time from 45 min to 28 min.

### Verification
Zero pocket tears across the remaining 14,000 units. Wash effect and vintage contrast remained 100% true to master buyer sample.`,
    author: {
      name: 'Kamal Uddin',
      role: 'Denim Washing Plant Specialist',
      department: 'Wet Processing Division',
      badges: ['Wet Process Expert'],
    },
    images: [
      {
        id: 'img-3a',
        url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
        caption: 'Defect: Frayed pocket bag edge with stone impact puncture holes after aggressive stone wash.',
        highlightDefect: true,
      },
      {
        id: 'img-3b',
        url: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80',
        caption: 'Solution: Temporary pocket tack stitch keeping stones out; clean, unblemished pocket bag after wash removal.',
        highlightDefect: false,
      },
    ],
    upvotesCount: 29,
    hasUpvoted: false,
    isBookmarked: false,
    isVerifiedSolution: true,
    viewsCount: 308,
    createdAt: '2026-09-20 14:20',
    comments: [],
  },
  {
    id: 'post-004',
    title: 'Overcoming Bowing & Skewing in Plaid / Check Fabric Spreading',
    category: 'CUTTING_PATTERN',
    tags: ['Fabric Spreading', 'Plaid Matching', 'Bowing Defect', 'Tension-Free Spreader'],
    summary:
      'Yarn-dyed check flannel shirts require 100% horizontal stripe alignment across front plackets. Here is how we solved spreading distortion and bowing.',
    content:
      `### The Challenge
When spreading 100% cotton yarn-dyed flannel (180 GSM, Tartan Check) across a 12-meter cutting table, fabric tension created a parabolic bow in the center of the lay, causing up to 1.5 cm misalignment between front left and right chest stripes.

### Key Factors
- Traditional automatic spreading machine pulled the roll with positive roll unwind tension, stretching the center more than the selvedges.
- Table vacuum was engaged before the fabric had fully relaxed after unwinding.

### The Fix
1. **48-Hour Relaxation**: Fabric rolls must be unwrapped and rested in loose loops on roll racks for a minimum of 24 to 48 hours before cutting.
2. **Optical Stripe Guide Laser**: Mounted dual green crosshair lasers on the spreader carriage to align the check grid against table reference marks every 2 meters.
3. **Needling Table Pins**: Installed vertical retractable alignment pins along the table edge to pin repeat squares in place during multi-ply spreading.

### Result
Check matching pass rate improved from 88% to 99.4%, meeting Ralph Lauren and Tommy Hilfiger strict zero-tolerance plaid matching criteria.`,
    author: {
      name: 'Salma Khatun',
      role: 'Chief Pattern & Spreading Master',
      department: 'Automated Cutting Room',
      badges: ['Pattern Master'],
    },
    images: [
      {
        id: 'img-4a',
        url: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&auto=format&fit=crop&q=80',
        caption: 'Defect: Severe center bowing curve causing front placket horizontal check lines to mismatch by 12mm.',
        highlightDefect: true,
      },
      {
        id: 'img-4b',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
        caption: 'Solution: Laser-aligned tension-free spreading yielding millimeter-perfect horizontal plaid line matching across chest and sleeves.',
        highlightDefect: false,
      },
    ],
    upvotesCount: 31,
    hasUpvoted: false,
    isBookmarked: false,
    isVerifiedSolution: true,
    viewsCount: 275,
    createdAt: '2026-09-18 11:10',
    comments: [],
  },
];
