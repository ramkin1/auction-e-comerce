# ArtBid - Auction Platform TODO

## Database & Schema
- [x] Users table (id, name, email, openId, role)
- [x] Items table (id, title, description, category, startingPrice, currentPrice, imageUrl, endTime, sellerId, status)
- [x] Bids table (id, userId, itemId, bidAmount, timestamp)
- [x] Payments table (id, userId, itemId, mpesaCode, phoneNumber, amount, status, checkoutRequestId)
- [x] WatchList table (id, userId, itemId)
- [x] Documents table (id, itemId, userId, type, fileUrl, fileKey, fileName)

## Backend (tRPC Routers)
- [x] items.list (public, with search/filter/pagination)
- [x] items.getById (public)
- [x] items.create (protected, seller)
- [x] items.update (protected, seller/admin)
- [x] items.delete (protected, seller/admin)
- [x] bids.place (protected)
- [x] bids.getByItem (public)
- [x] bids.getMyBids (protected)
- [x] payments.initiateMpesa (protected, STK Push)
- [x] payments.mpesaCallback (public webhook)
- [x] payments.getMyPayments (protected)
- [x] payments.checkStatus (protected)
- [x] watchlist.add (protected)
- [x] watchlist.remove (protected)
- [x] watchlist.getMyWatchlist (protected)
- [x] chatbot.message (public/protected, LLM-powered)
- [x] documents.upload (protected)
- [x] documents.getByItem (public)
- [x] documents.delete (protected)
- [x] dashboard.getSummary (protected)

## Frontend Pages
- [x] Landing page (hero, featured items, categories, how it works)
- [x] Browse/Search page (grid, filters, search)
- [x] Item detail page (images, description, bid history, countdown, chatbot)
- [x] Place bid flow (bid form, confirmation)
- [x] User dashboard (active bids, won items, watchlist, payment history)
- [x] Seller: create/edit listing page
- [x] M-Pesa payment flow (STK Push initiation, status polling)
- [x] Order tracking page
- [x] Chatbot widget (floating, LLM-powered)
- [x] Auth (login/register via Manus OAuth)
- [x] 404 page

## Features
- [x] Auction countdown timer (live, per item)
- [x] Real-time bid updates (polling or websocket)
- [x] Search and filter (category, price range, status)
- [x] M-Pesa STK Push integration (Safaricom Daraja API)
- [x] Payment status polling
- [x] LLM-powered chatbot
- [x] Seller document uploads (certificates, appraisals, provenance) to S3
- [x] Email/notification when outbid (owner notification proxy)
- [x] Email/notification when auction ending soon (owner notification proxy)
- [x] SEO meta tags, semantic HTML, alt text
- [x] sitemap.xml and robots.txt
- [x] Mobile responsive design
- [x] International Typographic Style (white, red accents, black sans-serif, grid)

## Tests
- [x] items router tests
- [x] bids router tests
- [x] payments router tests
- [x] chatbot router tests


## Admin Panel (New)
- [x] Admin router: getAllItems, getAllUsers, getAllPayments, getAnalytics, updateItemStatus, updateUserRole, updatePaymentStatus, moderationReports
- [x] Admin listing management page (view all, end auction, delete)
- [x] Admin user management page (view users, promote/demote admin, ban/unban)
- [x] Admin payment management page (view all payments, mark completed, refund)
- [x] Admin analytics dashboard (total auctions, revenue, active users, bid volume, top items)
- [x] Admin moderation page (moderation reports with status tracking)
- [x] Admin settings page (persistent auction rules, fees, image size)
- [x] Admin route protection (only admin users can access)
- [x] Admin navigation in Navbar
- [x] Persistent admin settings storage (DB table + CRUD)
- [x] User ban/unban functionality with reasons
- [x] Moderation reports table and workflow
- [x] Payment refund operations


## Seed Data (New)
- [x] Create seed script with 15-20 artwork/antique listings
- [x] Generate/fetch artwork images from public sources
- [x] Upload images to S3 and get CDN URLs
- [x] Insert listings into database with realistic prices and descriptions (20 items: 3 artwork, 3 furniture, 2 collectible sculptures, 3 jewelry, 4 collectible/antique, 5 mixed)
- [x] Verify all listings appear on Browse page


## Rebranding to AirBid (New)
- [x] Update app name and branding (AirBid)
- [x] Update CSS design tokens: purple/white light theme, dark gray/purple dark mode
- [x] Update logo (rounded purple square with gavel)
- [x] Update meta tags and SEO titles
- [x] Update navbar and hero copy
- [x] Add theme toggle button (Moon/Sun icons) in Navbar
- [x] Enable switchable theme (light/dark) with working toggle
- [x] All tests passing (20/20), TypeScript clean
