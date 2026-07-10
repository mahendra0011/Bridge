# Seed Images - Unsplash (Real Images)

This document describes the seed images used in demo data. All images are high-quality, professional photos from Unsplash.

## Overview

Images are loaded directly from Unsplash via CDN URLs. These are real, high-quality, relevant images for demo companies, agencies, and portfolios.

## Image URLs for Seed Files

### Company Logos (150x150)
| Name | Unsplash URL |
|------|--------------|
| healthtech-logo | https://images.unsplash.com/photo-1576091160399-1e6e4c37548e?w=150&h=150&fit=crop&q=80 |
| techcorp-logo | https://images.unsplash.com/photo-1550751827-64bde5b4b3c1?w=150&h=150&fit=crop&q=80 |
| innosoft-logo | https://images.unsplash.com/photo-1551650975-87d72d503ef2?w=150&h=150&fit=crop&q=80 |
| datasphere-logo | https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=150&h=150&fit=crop&q=80 |
| fintech-logo | https://images.unsplash.com/photo-1563986768609-32233ef00d06?w=150&h=150&fit=crop&q=80 |

### Cover/Banner Images (1920x400)
| Name | Unsplash URL |
|------|--------------|
| healthtech-banner | https://images.unsplash.com/photo-1576091160554-b32a31c4952d?w=1920&h=400&fit=crop&q=80 |
| techcorp-banner | https://images.unsplash.com/photo-1497366211944-e8acd9c1ecf8?w=1920&h=400&fit=crop&q=80 |
| innosoft-banner | https://images.unsplash.com/photo-1526738904085-6ca124643a64?w=1920&h=400&fit=crop&q=80 |
| datasphere-banner | https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=1920&h=400&fit=crop&q=80 |
| fintech-banner | https://images.unsplash.com/photo-1554261069-2a5947b6f6ea?w=1920&h=400&fit=crop&q=80 |

### Company Office Photos (600x400)
| Name | Unsplash URL |
|------|--------------|
| office-1 | https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80 |
| office-2 | https://images.unsplash.com/photo-1542744095-fcf47d8b5318?w=600&h=400&fit=crop&q=80 |
| team-event-1 | https://images.unsplash.com/photo-1517245386807-bb43f82c8e29?w=600&h=400&fit=crop&q=80 |
| meeting-1 | https://images.unsplash.com/photo-1519671481765-9a04cb1dc7e5?w=600&h=400&fit=crop&q=80 |

### Agency Logos (150x150)
| Name | Unsplash URL |
|------|--------------|
| demo-talent-agency-logo | https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=150&h=150&fit=crop&q=80 |
| creative-solutions-logo | https://images.unsplash.com/photo-1550751827-64bde5b4b3c1?w=150&h=150&fit=crop&q=80 |
| hr-consultants-logo | https://images.unsplash.com/photo-1560250097-0b9337271ff6?w=150&h=150&fit=crop&q=80 |

### Portfolio Images (600x400)
| Name | Unsplash URL |
|------|--------------|
| portfolio-tech | https://images.unsplash.com/photo-1467232014286-a89728073327?w=600&h=400&fit=crop&q=80 |
| portfolio-digital | https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80 |
| portfolio-content | https://images.unsplash.com/photo-1499755109340-9a5f03a4d1c2?w=600&h=400&fit=crop&q=80 |
| portfolio-hr | https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80 |

## Seed Files Updated

The following seed files now use these Unsplash image URLs:

1. **backend/seed-company.js** - HealthTech Inc logo, banner, and office photos
2. **backend/seed-demo-users.js** - Demo Talent Agency logo and portfolio
3. **backend/src/scripts/seed.js** - All demo companies and agencies

## How to Run Seed

```bash
cd backend
npm run seed:full
```

## Source

Images are sourced from [Unsplash](https://unsplash.com) - professional, high-quality, royalty-free images. All URLs include auto-optimization parameters (`q=80`, `fit=crop`).
