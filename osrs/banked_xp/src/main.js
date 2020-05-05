document.body.onload = () => {
    fetch('./src/xp.json').then((res) => res.json()).then((json) => {
        displaySkillSelection(json);
    });
};

function displaySkillSelection(skills) {
    let skillNames = Object.keys(skills);

    let div = document.getElementById('skill_selection');
    if (div != null) div.parentElement.removeChild(div);
    div = document.createElement('div');
    div.id = 'skill_selection';
    document.body.appendChild(div);

    let h1 = document.createElement('h1');
    h1.innerHTML = 'Select a Skill';
    div.appendChild(h1);

    for (let i = 0; i < skillNames.length; i++) {
        let name = skillNames[i];
        let inputBtn = document.createElement('input');
        inputBtn.type = 'button';
        inputBtn.value = name;
        inputBtn.onclick = () => {
            div.parentElement.removeChild(div);
            doSkill(name, skills[name]);
        };
        inputBtn.style.width = '80%';
        inputBtn.style.marginLeft = '10%';
        div.appendChild(inputBtn);
    }
}

function doSkill(skillKey, skillVal) {
    let div = document.getElementById('skill_content');
    if (div != null) div.parentElement.removeChild(div);
    div = document.createElement('div');
    div.id = 'skill_content';
    document.body.appendChild(div);


    for (let i = 0; i < skillVal.length; i++) {
        console.log(skillVal[i].cat_name);
    }
}
