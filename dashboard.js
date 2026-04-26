import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "./database.js";
document.addEventListener("DOMContentLoaded", () => {
const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");

const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");
const openRechargeBtn = document.getElementById("openRecharge");
const rechargePopup = document.getElementById("rechargePopup");
const closeRechargeBtn = document.getElementById("closeRechargeBtn");
const cancelRechargeBtn = document.getElementById("cancelRechargeBtn");
const submitRechargeBtn = document.getElementById("submitRechargeBtn");
const sourceCardRecharge = document.getElementById("sourceCardRecharge");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", () => {
  transferSection.classList.add("active");
});

closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);
document.getElementById("transferForm")
  .addEventListener("submit", handleTransfer);
const rechargeForm = document.getElementById("rechargeForm");

rechargeForm.addEventListener("submit", handleRecharge);
openRechargeBtn.addEventListener("click", () => {
  rechargePopup.classList.add("active");
});
closeRechargeBtn.addEventListener("click", () => {
  rechargePopup.classList.remove("active");
});

cancelRechargeBtn.addEventListener("click", () => {
  rechargePopup.classList.remove("active");
});
// Dashboard
function renderDashboard() {
  greetingName.textContent = user.name;
  currentDate.textContent = new Date().toLocaleDateString("fr-FR");
  solde.textContent = `${user.wallet.balance} ${user.wallet.currency}`;
  activecards.textContent = user.wallet.cards.length;

  const income = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((a, t) => a + t.amount, 0);

  const expenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((a, t) => a + t.amount, 0);

  incomeElement.textContent = income + " MAD";
  expensesElement.textContent = expenses + " MAD";

  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach(t => {
    const div = document.createElement("div");
    div.innerHTML = `${t.date} - ${t.amount} MAD - ${t.type}`;
    transactionsList.appendChild(div);
  });
}
renderDashboard();

// UI
function closeTransfer() {
  transferSection.classList.remove("active");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

beneficiaries.forEach(b => {
  const option = document.createElement("option");
  option.value = b.id;
  option.textContent = b.name;
  beneficiarySelect.appendChild(option);
});

user.wallet.cards.forEach(c => {
  const option = document.createElement("option");
  option.value = c.numcards;
  option.textContent = c.type + "****" + c.numcards;
  sourceCard.appendChild(option);
});
user.wallet.cards.forEach(c => {
  const option = document.createElement("option");
  option.value = c.numcards;
  option.textContent = c.type + " **** " + c.numcards;
  sourceCardRecharge.appendChild(option);
});

// =================== PROMISES ===================

// checkUser
function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dest = finduserbyaccount(numcompte);
      if (dest) resolve(dest);
      else reject("Destinataire non trouvé");
    }, 500);
  });
}

// checkSolde
function checkSolde(exp, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (exp.wallet.balance >= amount)
        resolve("Solde suffisant");
      else reject("Solde insuffisant");
    }, 400);
  });
}

// updateSolde
function updateSolde(exp, dest, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      exp.wallet.balance -= amount;
      dest.wallet.balance += amount;
      resolve("Solde mis à jour");
    }, 300);
  });
}

// addtransactions
function addtransactions(exp, dest, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const debit = {
        id: Date.now(),
        type: "debit",
        amount,
        from: exp.name,
        to: dest.name,
        date: new Date().toLocaleDateString()
      };

      const credit = {
        id: Date.now() + 1,
        type: "credit",
        amount,
        from: exp.name,
        to: dest.name,
        date: new Date().toLocaleDateString()
      };

      exp.wallet.transactions.push(debit);
      dest.wallet.transactions.push(credit);

      renderDashboard();
      resolve("Transaction enregistrée");
    }, 200);
  });
}


// la partie transferer _________

function transfer(exp, numcompte, amount) {
  console.log("Début du transfert");

  checkUser(numcompte)
    .then(dest => {
      console.log("Étape 1:", dest.name);
      return checkSolde(exp, amount).then(() => dest);
    })
    .then(dest => {
      console.log("Étape 2: Solde OK");
      return updateSolde(exp, dest, amount).then(() => dest);
    })
    .then(dest => {
      console.log("Étape 3: Solde mis à jour");
      return addtransactions(exp, dest, amount);
    })
    .then(msg => {
      console.log("Étape 4:", msg);
      console.log("Transfert réussi !");
    })
    .catch(err => {
      console.log("Erreur:", err);
    });
}
function handleTransfer(e) {
  e.preventDefault();
    console.log("CLICKED");
  const beneficiaryId = beneficiarySelect.value;
  const amount = Number(document.getElementById("amount").value);

  if (!beneficiaryId || !amount) {
    alert("Remplir les champs !");
    return;
  }

  const beneficiaryAccount =
    findbeneficiarieByid(user.id, beneficiaryId).account;

  transfer(user, beneficiaryAccount, amount);
}

// =================== HANDLE ===================


//============================================//
// ================la partie recharger=============//
// ==============================================//

//==========================================
//les promises 
//==========================================

//==========l'utilisateur possède au moins un moyen de paiment enregistré=========//
function checkpaiment(numcards){
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
        if(numcards.length>0){
              resolve(numcards);
        }
        else{
          reject("user ne possede aucun moyen de paiment !");
        }
    },600);
  })
}
//==========moyen de paiment selectinner est valide =======//
function checkmoyendepaiment(cards, selectedCard) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = cards.find(c => c.numcards == selectedCard);

      if (!card) {
        reject("carte non trouvée");
        return;
      }

      const today = new Date();
      const expiryDate = new Date(card.expiry);

      if (expiryDate < today) {
        reject("carte expirée");
      } else {
        resolve(card);
      }

    }, 500);
  });
}
//======check montant===========//
function checkmontant(amount){
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
       if(!amount || amount<=0){
        reject("montant invalide !");
       }
       else{
        resolve(amount);
       }
    },400);
  })
}
//==========en cas de succe==========//
//===================================//
//___________le solde de wallet est augmente du montant recharger___________//
function updatemontant(user , amount){

  return new Promise ((resolve,reject)=>{
    setTimeout(()=>{
        user.wallet.balance+=amount;
        console.log("solde mis a jour ");
          resolve("solde updated");
    },400);
  })
}
//___________addtransaction_________//
function addtransactionss(user, amount){
  return new Promise((resolve)=>{
    setTimeout(()=>{
      const transaction = {
        id: Date.now(),
        type: "RECHARGE",
        amount,
        date: new Date().toLocaleDateString()
      };

      user.wallet.transactions.push(transaction);
      renderDashboard();

      resolve("transaction enregistrée avec succès"); 
    },400);
  });
}
// dans la partie "en cas d'echec les 3 estimations seront signaler dans la fonction "
function recharger(moyenpaiment,amount){
    console.log("début de recharge !");
    checkpaiment(user.wallet.cards)
    .then(cards => {
      console.log("cards : ok");
      return checkmoyendepaiment(cards, moyenpaiment);
    })
    .then(() => {
      console.log(" carte valide");
      return checkmontant(amount);
    })
    .then(() => {
      console.log(" montant valide");
      return updatemontant(user, amount);
    })
    .then(() => {
      console.log("solde mis à jour");
      return addtransactionss(user, amount);
    })
    .then(msg => {
      console.log(msg);
      alert("Recharge réussie !");
    })
    .catch(err => {
      console.log("Erreur:", err);

     //======en cas d'erreur====//
      const safeAmount = amount || 0;

      const failedTransaction = {
        id: Date.now(),
        type: "RECHARGE",
        amount: safeAmount,
        status: "FAILED",
        reason: err,
        date: new Date().toLocaleDateString()
      };

      user.wallet.transactions.push(failedTransaction);
      renderDashboard();

      alert("Échec: " + err);
    });
}

//===============handl==============//
function handleRecharge(e){
  e.preventDefault();

  const moyen = sourceCardRecharge.value; 
  const amount = Number(document.getElementById("amountRecharge").value);

  recharger(moyen, amount);
}
});
