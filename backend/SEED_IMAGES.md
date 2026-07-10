# Seed Images - Cloudinary

This document describes the seed images uploaded to Cloudinary for demo data.

## Overview

Images are stored in Cloudinary under the `bridge/seed/` folder for use in seed data.

## Uploaded Images

### Company Logos (150x150)
| Name | Cloudinary URL |
|------|----------------|
| healthtech-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633723/bridge/seed/companyLogos/healthtech-logo.jpg |
| techcorp-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633724/bridge/seed/companyLogos/techcorp-logo.jpg |
| innosoft-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633726/bridge/seed/companyLogos/innosoft-logo.jpg |
| datasphere-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633727/bridge/seed/companyLogos/datasphere-logo.jpg |
| fintech-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633729/bridge/seed/companyLogos/fintech-logo.jpg |

### Cover/Banner Images (1920x400)
| Name | Cloudinary URL |
|------|----------------|
| healthtech-banner | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633731/bridge/seed/coverBanners/healthtech-banner.jpg |
| techcorp-banner | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633733/bridge/seed/coverBanners/techcorp-banner.jpg |
| innosoft-banner | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633735/bridge/seed/coverBanners/innosoft-banner.jpg |
| datasphere-banner | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633738/bridge/seed/coverBanners/datasphere-banner.jpg |
| fintech-banner | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633740/bridge/seed/coverBanners/fintech-banner.jpg |

### Company Office Photos (600x400)
| Name | Cloudinary URL |
|------|----------------|
| office-1 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633742/bridge/seed/companyPhotos/office-1.jpg |
| office-2 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633743/bridge/seed/companyPhotos/office-2.jpg |
| office-3 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633744/bridge/seed/companyPhotos/office-3.jpg |
| office-4 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633746/bridge/seed/companyPhotos/office-4.jpg |
| team-event-1 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633747/bridge/seed/companyPhotos/team-event-1.jpg |
| team-event-2 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633748/bridge/seed/companyPhotos/team-event-2.jpg |
| meeting-1 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633750/bridge/seed/companyPhotos/meeting-1.jpg |
| workspace-1 | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633751/bridge/seed/companyPhotos/workspace-1.jpg |

### Agency Logos (150x150)
| Name | Cloudinary URL |
|------|----------------|
| demo-talent-agency-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633753/bridge/seed/agencyLogos/demo-talent-agency-logo.jpg |
| creative-solutions-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633754/bridge/seed/agencyLogos/creative-solutions-logo.jpg |
| hr-consultants-logo | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633755/bridge/seed/agencyLogos/hr-consultants-logo.jpg |

### Portfolio Images (600x400)
| Name | Cloudinary URL |
|------|----------------|
| portfolio-tech | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633756/bridge/seed/portfolioImages/portfolio-tech.jpg |
| portfolio-hr | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633758/bridge/seed/portfolioImages/portfolio-hr.jpg |
| portfolio-digital | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633759/bridge/seed/portfolioImages/portfolio-digital.jpg |
| portfolio-content | https://res.cloudinary.com/dfmetzhrk/image/upload/v1783633760/bridge/seed/portfolioImages/portfolio-content.jpg |

## How to Re-upload Images

If you need to regenerate the images or update URLs:

```bash
cd backend
node seed-images-cloudinary.js
```

This will:
1. Fetch placeholder images from picsum.photos
2. Upload them to Cloudinary with auto optimization
3. Print the new URLs for copying to seed files

## Source

Images are sourced from [picsum.photos](https://picsum.photos) - a free placeholder image service. All images are automatically optimized by Cloudinary with `quality: auto` and `fetch_format: auto`.