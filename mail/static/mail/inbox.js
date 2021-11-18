document.addEventListener('DOMContentLoaded', function () {

  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  load_mailbox('inbox');

});


function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  if (email.sender == undefined || email.recipients == undefined || email.subject == undefined) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  else {
    document.querySelector('#compose-recipients').value = email.sender;
    var startStr = "Re:"
    var subjectStr = email.subject.substring(0, startStr.length)

    if (startStr === subjectStr) {
      document.querySelector('#compose-subject').value = email.subject;
    }
    else {
      document.querySelector('#compose-subject').value = "Re: " + email.subject;
    }

    bodyStr = `On ${email.timestamp}, ${email.sender} wrote: `;
    document.querySelector('#compose-body').value  = bodyStr + email.body;
  }

  const inputRecipients = document.querySelector('#compose-recipients');
    
  document.querySelector('#compose-form').addEventListener('submit', () => { //try it with submit button?
    event.preventDefault();

    if (inputRecipients.value.length === 0) {
      alert("At leat one recipient is required.");
    }
    else {
      submit_form();
    }
  });
}


function submit_form() {
  const recipients = document.getElementById('compose-recipients').value;
  const subject = document.getElementById('compose-subject').value;
  const body = document.getElementById('compose-body').value;

  
  var spaces = [];
  for (i = 0; i < recipients.length; i++) {
    if (recipients.charAt(i) === " ")
    {
      spaces.push(i);
    }
  }

  var r = "";
  var k = 0;

  if (spaces.length === 0) {
    r = recipients;
  }
  else {
    for (j = 0, len = recipients.length; j < len; j++) {

      r += recipients.substring(j, spaces[k]) + ","; 
      j = spaces[k];
      k++;

      if (k === spaces.length) {
        r += recipients.substring(j + 1);
        break;
      }
    } 
  } 

  fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' },
    body: JSON.stringify({
        recipients: r,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  load_mailbox('sent');
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get me all the emails in inbox(example)
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    //for each email
    emails.forEach(myFunction);

    function myFunction(item) {

      //create a new div htmlelement
      const element = document.createElement('div');
      //give it a class in case i need it
      element.setAttribute("class", "email-dv")

      //add info to this div
      if (mailbox === "sent")
      {
        element.innerHTML += "To: " + item.recipients + "<br>";
      }
      else {
        element.innerHTML += "From: " + item.sender + "<br>";
      }

      element.innerHTML += "Subject: " + item.subject + "<br>";
      element.innerHTML += "Date: " + item.timestamp + "<br>";
      
      element.style.border = "groove"; 
      element.style.margin = "10px" ;

      //if email is not read
      if (item.read === false) { 
        element.style.backgroundColor = "white";
      }
      else {
        element.style.backgroundColor = "#e0e0e0";
      }

      element.addEventListener('click', () => load_email(item, mailbox));

      //add it to the main div for all emails
      document.querySelector('#emails-view').append(element);
    }

  });

}


function load_email(item, mailbox) {

  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';

  id = item.id;

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    var element =  document.getElementById('email-view');

    element.innerHTML = "<strong>From: </strong>" +  email.sender + "<br>";
    element.innerHTML += "<strong>To: </strong>" + email.recipients + "<br>";
    element.innerHTML += "<strong>Date: </strong>" + email.timestamp + "<br>";
    element.innerHTML +="<strong>Subject: </strong>" + email.subject + "<br>";
    element.innerHTML +="<strong>About: </strong>" + email.body + "<br>";
    
    const replyBtn = document.createElement('button');
    replyBtn.innerHTML = "Reply";
    document.querySelector('#email-view').append(replyBtn);
    replyBtn.addEventListener('click', () => compose_email(email));

    if (mailbox === "inbox" || mailbox === "archive") {

      const btn = document.createElement('button');
      btn.setAttribute("class", "btn btn-light")

      if (mailbox === "inbox") {
        archive = true; //var?
        btn.innerHTML = "Archive";
      }
      else {
        archive = false;
        btn.innerHTML = "Unarchive";
      }

      document.querySelector('#email-view').append(btn);  
      btn.addEventListener('click', () => load_archive(email, archive));
    }
  });

}


function load_archive(email, archive) {

  id = email.id;

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive
    })
  })

  load_mailbox('inbox');
}