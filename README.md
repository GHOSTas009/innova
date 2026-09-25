# INNOVA — Ticket Registration UI + Google Sheets Backend

## Customer flow

Customer → enters name/mobile/email → chooses ticket quantity → total is calculated → sees account-transfer information → enters transaction/reference ID + payment date → submits order.

The order is recorded in Google Sheets as PENDING.

Admin manually verifies the bank/account transfer in the real account.

Admin changes PaymentStatus to PAID and enters the TicketNumber in the same row.

Customer can then enter their Order ID on the website to see the current payment status and assigned ticket number.

## Stage 1
The UI works without a backend using localStorage for demonstration.

## Stage 2 — Connect Google Sheets

### A. Create Sheet
Create a Google Sheet and a tab called `Orders`.

Put these headers in row 1:

OrderID | Timestamp | Name | Mobile | Email | TicketType | Quantity | UnitPrice | Total | TransactionID | PaymentDate | PaymentStatus | TicketNumber

### B. Apps Script
1. Open the Sheet.
2. Extensions → Apps Script.
3. Delete the default code.
4. Paste `Code.gs` from this package.
5. Replace:
   `PASTE_YOUR_SPREADSHEET_ID_HERE`
   with the ID from your Google Sheet URL.
6. Save.

Example Sheet URL:
https://docs.google.com/spreadsheets/d/1ABCxyz123456789/edit

The Spreadsheet ID is:
1ABCxyz123456789

### C. Deploy
Apps Script → Deploy → New deployment → Web app.

Set:
- Execute as: Me
- Who has access: Anyone

Deploy and copy the `/exec` URL.

### D. Connect website
Open `app.js`.

Find:
`const APPS_SCRIPT_URL = "";`

Paste your `/exec` URL between the quotes.

Example:
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";

Save and upload the website files to GitHub Pages.

## Admin process

New row:
PaymentStatus = PENDING
TicketNumber = blank

After checking the bank/account:
PaymentStatus = PAID
TicketNumber = the ticket number you give the customer

The customer can then use Order Status on the website.

## Before going live
Replace:
- event date
- venue
- ticket prices
- bank/account details
- INNOVA artwork/logo

Do not put Google Sheet credentials or private admin passwords in the frontend.
