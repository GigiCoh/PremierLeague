// Function to navigate between pages
function navigateToSselect() {
  window.location.href = "select.html"; // Redirects to the specified HTML page
}
function navigateToPage() {
  window.location.href = "index.html"; // Redirects to the specified HTML page
}

//carousel
function updateCarouselImage(dropdownId, imageId, captionId) {
  const dropdown = document.getElementById(dropdownId);
  const selectedOption = dropdown.options[dropdown.selectedIndex];
  const imageUrl = selectedOption.getAttribute("data-image");
  const teamName = selectedOption.text;

  // Update carousel image and caption
  document.getElementById(imageId).src = imageUrl;
  document.getElementById(captionId).innerHTML = `<h3>${teamName}</h3><p>Selected team: ${teamName}</p>`;
}


// Function to navigate to results after fetching team data
//fetch team 1 and team 2
function navigateToResult() {
  const team1 = document.getElementById('team1Dropdown').value;
  const team2 = document.getElementById('team2Dropdown').value;
  console.log("Team 1: "+ team1);
  console.log("Team 2: " + team2);

  if (team1 && team2) {
    localStorage.setItem('selectedTeam1', team1);
    localStorage.setItem('selectedTeam2', team2);
    // Call the function to fetch data for both teams
    fetchHistoricalData(team1, team2);
    window.location.href = "historical_scores.html";

   
  } else {
    alert("Please select both teams for prediction.");
  }

}

//fetch the data from dataset for team 1 and team 2
function fetchHistoricalData(team1, team2) {
  fetch('http://127.0.0.1:5000/get_teams_data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ team1: team1, team2: team2 })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Fetched team data:", data);
    displayHistoricalData(data.team1_data, data.team2_data);
  })
  .catch(error => {
    console.error("Error fetching team data:", error);
  });
}



// Storing data in sessionStorage and navigating to historical_scores.html
function navigateToResult() {
  const team1 = document.getElementById('team1Dropdown').value;
  const team2 = document.getElementById('team2Dropdown').value;

  if (team1 && team2) {
    // Store selected team names in sessionStorage
    sessionStorage.setItem('team1Name', team1);
    sessionStorage.setItem('team2Name', team2);

    fetchHistoricalData(team1, team2);
  } else {
    alert("Please select both teams for prediction.");
  }
}

// Fetch data from server and store it in sessionStorage
function fetchHistoricalData(team1, team2) {
  fetch('http://127.0.0.1:5000/get_teams_data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ team1: team1, team2: team2 })
  })
  .then(response => response.json())
  .then(data => {
    // Store fetched data in sessionStorage
    sessionStorage.setItem('team1Data', JSON.stringify(data.team1_data));
    sessionStorage.setItem('team2Data', JSON.stringify(data.team2_data));
    sessionStorage.setItem('team1Prediction', JSON.stringify(data.team1_prediction));
    sessionStorage.setItem('team2Prediction', JSON.stringify(data.team2_prediction));


    // Redirect to the results page
    window.location.href = "historical_scores.html";
  })
  .catch(error => {
    console.error("Error fetching team data:", error);
  });
}

// Display historical data on historical_scores.html
function displayHistoricalData() {
  const team1Data = JSON.parse(sessionStorage.getItem('team1Data'));
  const team2Data = JSON.parse(sessionStorage.getItem('team2Data'));
  const team1Prediction = sessionStorage.getItem('team1Prediction');
  const team2Prediction = sessionStorage.getItem('team2Prediction');
  const team1Name = sessionStorage.getItem('team1Name');
  const team2Name = sessionStorage.getItem('team2Name');

  if (team1Data && team2Data) {
    populateTable('team1Data', team1Data);
    populateTable('team2Data', team2Data);

    plotGraph('team1Chart', team1Data, 'Team 1 Score over Time');
    plotGraph('team2Chart', team2Data, 'Team 2 Score over Time');

    document.getElementById('team1Title').innerText = `${team1Name} - Historical Scores`;
    document.getElementById('team2Title').innerText = `${team2Name} - Historical Scores`;


       // Display predicted scores with team names
    document.getElementById('team1Prediction').innerText = `Score for Team 1(${team1Name}): ${team1Prediction}`;
    document.getElementById('team2Prediction').innerText = `Score for Team 1(${team2Name}): ${team2Prediction}`;

    // Determine winner and loser based on predictions
    let winner, loser;
    if (team1Prediction > team2Prediction) {
      winner = { name: team1Name, prediction: team1Prediction };
      loser = { name: team2Name, prediction: team2Prediction };
    } else if (team2Prediction > team1Prediction) {
      winner = { name: team2Name, prediction: team2Prediction };
      loser = { name: team1Name, prediction: team1Prediction };
    } else {
      document.getElementById('winnerDetails').innerText = `It's a tie between ${team1Name} and ${team2Name}!`;
      const element = document.getElementById('loserDetails');
      element.style.display = 'none';
      return;
    }

    // Display winner and loser details
    document.getElementById('winnerDetails').innerText = `Winner: ${winner.name}`;
    document.getElementById('loserDetails').innerText = `Loser: ${loser.name}`;
     } else{  
      console.error("No data found in sessionStorage.");
  }
  
}

// Populate HTML table with data
function populateTable(tableId, data) {
  const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  
  for (const [date, score] of Object.entries(data)) {
    const row = tableBody.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);

    // Format the date
    const formattedDate = new Date(date).toISOString().split('T')[0];
    cell1.innerHTML = formattedDate;
    cell2.innerHTML = score.Score; // Assuming 'Score' is the key in the dictionary
  }
}

// Plotting the graphs using Chart.js
function plotGraph(chartId, data, label) {
  const labels = Object.keys(data).map(date => new Date(date).toISOString().split('T')[0]);
  const scores = Object.values(data).map(score => score.Score); // Assuming 'Score' is the key in the dictionary

  const ctx = document.getElementById(chartId).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: scores,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Match Date' } },
        y: { title: { display: true, text: 'Score' } }
      }
    }
  });
}








