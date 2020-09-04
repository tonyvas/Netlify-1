let questData = null;
let completedQuests = [];

document.body.onload = () => {
	fetch('quest_data_4.json')
		.then((res) => res.json())
		.then((obj) => {
			questData = obj;
			doDisplayStuff();
		})
		.catch((e) => {
			alert('Failed Loading Quest Data!');
			console.error(e);
		});
};

document.getElementById('search_div').onkeydown = (e) => {
	if (e.key == 'Enter') search();
};

function search() {
	let text = document.getElementById('search_text_input').value;
	if (text == '') return;

	let keywords = text.split(' ');
	doDisplayStuff(keywords);
}

function reset() {
	completedQuests = [];
	document.getElementById('search_text_input').value = '';
	doDisplayStuff();
}

function showInstructions() {
	alert(
		'How to Use\n\n' +
			' - Double click on a quest to mark as complete/incomplete\n\n' +
			' - Red means you do not have the preQuests\n\n' +
			' - Yellow means you have the preQuests\n\n' +
			' - Green means you have completed the quest'
	);
}

function doDisplayStuff(keywords = null) {
	let trees = document.getElementsByClassName('tree_div');
	while (trees.length > 0) {
		trees[0].parentElement.removeChild(trees[0]);
	}

	if (keywords == null) {
		let endQuests = getEndQuests();
		let sortedEndQuests = sortQuestsByAmountOfPrequests(endQuests);
		drawTrees(sortedEndQuests);
	} else {
		let quests = getQuestsWithKeywords(keywords);
		for (let quest in quests) {
			let parentQuests = getQuestsWithQuestAsPrequest(quest);
			for (parentQuest of parentQuests) {
				quests.push(parentQuest);
			}
		}
		drawTrees(quests, keywords);
	}
}

function drawTrees(quests, wordsToHighlight = null) {
	let mainDiv = document.getElementById('trees_div');
	for (let quest of quests) {
		let treeDiv = document.createElement('div');
		treeDiv.classList.add('tree_div');
		mainDiv.appendChild(treeDiv);

		drawTree(quest, treeDiv, wordsToHighlight);
	}

	function drawTree(quest, div, wordsToHighlight, depth = 0, branchDepths = [], isLastChild = true) {
		let indent = '';
		for (let i = 0; i < depth; i++) {
			if (branchDepths.includes(i) && i != depth - 1) {
				indent += ' ┃  ';
				continue;
			} else if (i < depth - 1) {
				indent += '    ';
				continue;
			}

			if (isLastChild) {
				indent += ' ┗━ ';
				continue;
			}

			indent += ' ┣━ ';
		}

		let line_div = document.createElement('div');
		line_div.classList.add('line_div');

		div.appendChild(line_div);

		let indentPre = document.createElement('pre');
		let questPre = document.createElement('pre');

		line_div.appendChild(indentPre);
		line_div.appendChild(questPre);

		indentPre.innerHTML = indent;
		questPre.innerHTML = quest;

		if (wordsToHighlight != null) {
			for (let word of wordsToHighlight) {
				if (quest.toLowerCase().includes(word.toLowerCase())) {
					questPre.classList.add('highlight_quest');
					break;
				}
			}
		}

		if (completedQuests.includes(quest)) {
			questPre.classList.add('completed_quest');
		} else if (canDoQuest(quest)) {
			questPre.classList.add('available_quest');
		} else {
			questPre.classList.add('unavailable_quest');
		}

		line_div.ondblclick = () => {
			toggleQuestCompletion(quest);
		};

		let prequests = sortQuestsByAmountOfPrequests(questData[quest]['requirements']['quests']);
		for (let i = 0; i < prequests.length; i++) {
			let last = i == prequests.length - 1;
			if (!isLastChild) {
				branchDepths.push(depth - 1);
			} else {
				let newBranchDepths = [];
				for (let d of branchDepths) {
					if (d != depth - 1) newBranchDepths.push(d);
				}
				branchDepths = newBranchDepths;
			}
			drawTree(prequests[i], div, wordsToHighlight, depth + 1, branchDepths, last);
		}
	}
}

function toggleQuestCompletion(quest) {
	if (completedQuests.includes(quest)) {
		completedQuests.splice(completedQuests.indexOf(quest), 1);

		let prequests = questData[quest]['requirements']['quests'];
		for (let prequest of prequests) {
			completedQuests.splice(completedQuests.indexOf(prequest), 1);
		}
	} else {
		if (canDoQuest(quest)) {
			completedQuests.push(quest);
		}
	}

	doDisplayStuff();
}

function getEndQuests() {
	let endQuests = [];
	for (let quest in questData) {
		isPrequest = false;
		for (let checkQuest in questData) {
			if (questData[checkQuest]['requirements']['quests'].includes(quest)) {
				isPrequest = true;
				break;
			}
		}
		if (!isPrequest) {
			endQuests.push(quest);
		}
	}
	return endQuests;
}

function getQuestsWithKeywords(keywords) {
	let questsObj = {};
	let returnQuests = [];

	let quests = Object.keys(questData);
	for (let quest of quests) {
		let score = 0;
		for (let keyword of keywords) {
			if (quest.toLowerCase().includes(keyword.toLowerCase())) {
				score++;
			}
		}

		if (score > 0) {
			if (questsObj[score] == undefined) questsObj[score] = [];
			questsObj[score].push(quest);
		}
	}

	let scores = Object.keys(questsObj).sort();
	for (let score of scores) {
		let sortedQuests = sortQuestsByAmountOfPrequests(questsObj[score]);
		for (let quest of sortedQuests) {
			returnQuests.push(quest);
		}
	}

	return returnQuests;
}

function getQuestsWithQuestAsPrequest(prequest) {
	let quests = [];
	for (let quest in questData) {
		if (questData[quest]['requirements']['quests'].includes(prequest)) {
			quests.push(quest);
		}
	}
	return quests;
}

function sortQuestsByAmountOfPrequests(quests) {
	let counts = {};
	let sorted = [];

	for (let quest of quests) {
		let count = getCountOfPrequests(quest);
		if (counts[count] == undefined) counts[count] = [];
		counts[count].push(quest);
		counts[count].sort();
	}

	let keys = Object.keys(counts);
	for (let key of keys) {
		for (let quest of counts[key]) {
			sorted.push(quest);
		}
	}

	return sorted;
}

function getCountOfPrequests(quest) {
	let prequests = questData[quest]['requirements']['quests'];
	let count = prequests.length;

	for (let prequest of prequests) {
		count += getCountOfPrequests(prequest);
	}

	return count;
}

function canDoQuest(quest) {
	let prequests = questData[quest]['requirements']['quests'];
	for (let prequest of prequests) {
		if (!completedQuests.includes(prequest)) {
			return false;
		}
	}
	return true;
}
