/*
  UI-only version.
  IMPORTANT: Set APPS_SCRIPT_URL after creating your Google Apps Script web app.
  The current UI is usable without it and stores a local demo order in the browser.
*/
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxaWZTZ4IDRKMdftAOpnu_6QZX_wa-F-IK0S8kr_TPdXn8tnnFUQE75GI11QX0Gi8U/exec";

const state = {type:"VIP", price:4000, quantity:1};

const $ = id => document.getElementById(id);
const money = n => `Rs. ${Number(n).toLocaleString("en-PK")}`;

function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}
function makeOrderId(){ return "INN-"+Math.floor(100000+Math.random()*900000); }

function calculate(){
  state.quantity=Math.max(1,Math.min(10,Number($("quantity").value)||1));
  $("quantity").value=state.quantity;
  $("calcPrice").textContent=money(state.price);
  $("calcQty").textContent=state.quantity;
  $("calcTotal").textContent=money(state.price*state.quantity);
}

document.querySelectorAll(".choose-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    state.type=btn.dataset.type; state.price=Number(btn.dataset.price); state.quantity=1;
    $("selectedType").textContent=state.type;
    $("selectedPrice").textContent=money(state.price);
    $("quantity").value=1; calculate();
    $("registration").classList.remove("hidden");
    $("confirmation").classList.add("hidden");
    $("registration").scrollIntoView({behavior:"smooth"});
  });
});

$("quantity").addEventListener("input",calculate);

$("backTickets").addEventListener("click",()=>{
  $("registration").classList.add("hidden");
  $("tickets").scrollIntoView({behavior:"smooth"});
});

function getForm(){
  return {
    orderId:makeOrderId(),
    name:$("name").value.trim(),
    mobile:$("mobile").value.trim(),
    email:$("email").value.trim(),
    ticketType:state.type,
    quantity:state.quantity,
    unitPrice:state.price,
    total:state.price*state.quantity,
    transactionId:$("transaction").value.trim(),
    paymentDate:$("paymentDate").value
  };
}

async function sendToSheet(order){
  /*
    When APPS_SCRIPT_URL is connected, this sends the order to Google Apps Script.
    text/plain avoids a custom JSON Content-Type preflight.
  */
  if(!APPS_SCRIPT_URL) return {demo:true};

  const body=JSON.stringify({action:"createOrder",...order});
  try{
    await fetch(APPS_SCRIPT_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body
    });
    return {submitted:true};
  }catch(err){
    console.warn("Apps Script submission failed:",err);
    return {submitted:false};
  }
}

$("submitOrder").addEventListener("click",async()=>{
  const order=getForm();
  if(!order.name||!order.mobile||!order.email||!order.transactionId||!order.paymentDate){
    toast("Please complete all required details."); return;
  }
  const emailOK=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email);
  if(!emailOK){toast("Please enter a valid email address.");return}

  const result=await sendToSheet(order);
  if(APPS_SCRIPT_URL && result.submitted===false){
    toast("Could not submit the order. Please try again.");
    return;
  }

  localStorage.setItem("innovaOrder_"+order.orderId,JSON.stringify({...order,paymentStatus:"PENDING",ticketNumber:""}));
  $("orderIdDisplay").textContent=order.orderId;
  $("orderNameDisplay").textContent=order.name;
  $("orderTicketsDisplay").textContent=`${order.ticketType} × ${order.quantity}`;
  $("orderTotalDisplay").textContent=money(order.total);
  $("registration").classList.add("hidden");
  $("confirmation").classList.remove("hidden");
  $("confirmation").scrollIntoView({behavior:"smooth"});
});

$("goStatus").addEventListener("click",()=>{
  $("confirmation").classList.add("hidden");
  $("status").scrollIntoView({behavior:"smooth"});
});

$("lookupBtn").addEventListener("click",async()=>{
  const id=$("lookupId").value.trim().toUpperCase();
  if(!id){toast("Enter your Order ID.");return}

  /*
    Stage 1: look up locally.
    Stage 2: this same button will call Apps Script and retrieve
    payment status + ticket number from Google Sheets.
  */
  const local=localStorage.getItem("innovaOrder_"+id);
  if(local){
    renderStatus(JSON.parse(local)); return;
  }

  if(!APPS_SCRIPT_URL){
    $("statusResult").classList.remove("hidden");
    $("statusResult").innerHTML="<p style='color:#ff657a;font-size:12px'>Order not found in this browser. After Google Sheets is connected, this page will check the live order database.</p>";
    return;
  }

  try{
    const res=await fetch(APPS_SCRIPT_URL+"?action=getOrder&orderId="+encodeURIComponent(id));
    const data=await res.json();
    if(!data.success){renderNotFound();return}
    renderStatus(data.order);
  }catch(e){
    toast("Could not check the order right now.");
  }
});

function renderNotFound(){
  $("statusResult").classList.remove("hidden");
  $("statusResult").innerHTML="<p style='color:#ff657a;font-size:12px'>Order not found.</p>";
}

function renderStatus(order){
  $("statusResult").classList.remove("hidden");
  const ticket=order.ticketNumber||order.TicketNumber||"Not assigned yet";
  const status=order.paymentStatus||order.PaymentStatus||"PENDING";
  $("statusResult").innerHTML=`
    <div class="status-line"><span>Order ID</span><b>${order.orderId||order.OrderID}</b></div>
    <div class="status-line"><span>Name</span><b>${order.name||order.Name}</b></div>
    <div class="status-line"><span>Tickets</span><b>${order.ticketType||order.TicketType} × ${order.quantity||order.Quantity}</b></div>
    <div class="status-line"><span>Total</span><b>${money(order.total||order.Total)}</b></div>
    <div class="status-line"><span>Payment</span><b class="${status==="PAID"?"":"pending"}">${status}</b></div>
    <div class="status-line"><span>Ticket Number</span><b>${ticket}</b></div>
    ${ticket!=="Not assigned yet"?'<p style="color:#00e58a;font-size:11px;margin-top:15px">Your ticket number has been assigned. Keep it safe.</p>':""}`;
}
