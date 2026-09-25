/**
 * INNOVA Google Sheets backend
 *
 * SHEET SETUP:
 * 1. Create a Google Sheet.
 * 2. Create a tab named Orders.
 * 3. Put these headers in row 1:
 *
 * A OrderID
 * B Timestamp
 * C Name
 * D Mobile
 * E Email
 * F TicketType
 * G Quantity
 * H UnitPrice
 * I Total
 * J TransactionID
 * K PaymentDate
 * L PaymentStatus
 * M TicketNumber
 *
 * 4. Paste your Spreadsheet ID below.
 * 5. Deploy as Web app:
 *    Execute as: Me
 *    Who has access: Anyone
 *
 * The website will submit new orders with status PENDING.
 * You manually change PaymentStatus to PAID and enter TicketNumber.
 */

const SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Orders";

function getSheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");

    if (data.action === "createOrder") {
      return createOrder_(data);
    }

    return json_({success:false,error:"Unknown action"});
  } catch (err) {
    return json_({success:false,error:String(err)});
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "getOrder") {
      return getOrder_(e.parameter.orderId);
    }

    return json_({success:true,online:true});
  } catch (err) {
    return json_({success:false,error:String(err)});
  }
}

function createOrder_(data) {
  const sheet = getSheet_();

  if (!data.orderId || !data.name || !data.mobile || !data.email ||
      !data.ticketType || !data.quantity || !data.total ||
      !data.transactionId || !data.paymentDate) {
    return json_({success:false,error:"Missing required information"});
  }

  // Prevent accidental duplicate OrderID submissions.
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2,1,lastRow-1,1).getValues().flat();
    if (ids.includes(data.orderId)) {
      return json_({success:true,duplicate:true,orderId:data.orderId});
    }
  }

  sheet.appendRow([
    data.orderId,
    new Date(),
    data.name,
    data.mobile,
    data.email,
    data.ticketType,
    Number(data.quantity),
    Number(data.unitPrice),
    Number(data.total),
    data.transactionId,
    data.paymentDate,
    "PENDING",
    ""
  ]);

  return json_({
    success:true,
    orderId:data.orderId,
    paymentStatus:"PENDING",
    message:"Order recorded"
  });
}

function getOrder_(orderId) {
  if (!orderId) return json_({success:false,error:"Order ID required"});

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i=1; i<values.length; i++) {
    const row = values[i];

    if (String(row[0]).toUpperCase() === String(orderId).toUpperCase()) {
      return json_({
        success:true,
        order:{
          orderId:String(row[0]),
          timestamp:row[1],
          name:String(row[2]),
          mobile:String(row[3]),
          email:String(row[4]),
          ticketType:String(row[5]),
          quantity:Number(row[6]),
          unitPrice:Number(row[7]),
          total:Number(row[8]),
          transactionId:String(row[9]),
          paymentDate:String(row[10]),
          paymentStatus:String(row[11] || "PENDING"),
          ticketNumber:String(row[12] || "")
        }
      });
    }
  }

  return json_({success:false,error:"Order not found"});
}
