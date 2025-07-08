/* global Chart */
window.addEventListener('load', () => {
	document.querySelectorAll('canvas[id^="myChart-"]').forEach((canvas) => {
		const labelsRaw = canvas.dataset.labels;
		const votesRaw = canvas.dataset.votes;

		if (!labelsRaw || !votesRaw) {
			return;
		}

		let labels, votes;
		try {
			labels = JSON.parse(labelsRaw);
			votes = JSON.parse(votesRaw);
		} catch (error) {
			return;
		}

		const totalVotes = votes.reduce((acc, x) => acc + x, 0);
		const ctx = canvas.getContext('2d');

		new Chart(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Answers',
						data: votes.map((el) => ((el / totalVotes) * 100).toFixed(1)),
						backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6']
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						display: false 
					},
					title: { display: true, text: 'Survey results, %' }
				},
				scales: {
					y: { min: 0, max: 100, ticks: { stepSize: 10 } }
				}
			}
		});
	});
});
