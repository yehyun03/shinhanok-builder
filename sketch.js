let editPaletteMode = false; // 편집 모드 여부
let images = {};
let palette = [];
let placed = [];
let selectedPart = null;
let offsetX, offsetY;
let labels = [
  { text: "Main Structure", x: 20, y: 40, size: 20 },
  { text: "Wall", x: 20, y: 80, size: 20 },
  { text: "Entrance", x: 20, y: 120, size: 20 },
  { text: "Structure", x: 20, y: 140, size: 20 },  // 한 줄 아래로
  { text: "Terrace", x: 200, y: 40, size: 20 },
  { text: "Main Gate", x: 200, y: 80, size: 20 },
  { text: "Window", x: 200, y: 120, size: 20 }
];

function preload() {
  loadJSON("layout.json", data => {
    for (let item of data.palette) {
      images[item.name] = loadImage(item.name + ".png");
    }
  });
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  loadJSON("layout.json", data => {
    // palette 복원
    palette = data.palette.map(item => ({
      ...item,
      img: images[item.name],
      isPalette: true
    }));

    // labels 복원
    labels = data.labels || [];
  });
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}



function draw() {
  background(0); // 대지: 검정 배경

  // 팔레트 영역 배경
  noStroke();
  fill(255); // 팔레트: 흰색 배경
  rect(0, 0, width, 180);  // 상단 팔레트
  rect(0, 0, 180, height); // 좌측 팔레트

  // 부품 이미지 출력
  for (let p of [...palette, ...placed]) {
    image(p.img, p.x, p.y, p.w, p.h);
  }

  // 텍스트 라벨 출력
  for (let lbl of labels) {
    textFont("Georgia");

    textSize(lbl.size);
    fill(0); // 글자: 검정
    noStroke();
    text(lbl.text, lbl.x, lbl.y);
  }
}



function mousePressed() {
  // 1. 먼저 placed 부품들 중 선택
  for (let i = placed.length - 1; i >= 0; i--) {
    let p = placed[i];
    if (isMouseOver(p)) {
      selectedPart = p;
      offsetX = mouseX - p.x;
      offsetY = mouseY - p.y;
      placed.splice(i, 1);
      placed.push(selectedPart);
      return;
    }
  }

  // 2. editPaletteMode가 켜져 있다면 palette 위치 이동
  if (editPaletteMode) {
    for (let i = palette.length - 1; i >= 0; i--) {
      let p = palette[i];
      if (isMouseOver(p)) {
        selectedPart = p;
        offsetX = mouseX - p.x;
        offsetY = mouseY - p.y;
        palette.splice(i, 1);
        palette.push(selectedPart);
        return;
      }
    }

    // 3. 텍스트 라벨 드래그 선택
    for (let i = labels.length - 1; i >= 0; i--) {
      let lbl = labels[i];
      textSize(lbl.size);
      let tw = textWidth(lbl.text);
      let th = lbl.size;

      if (
        mouseX > lbl.x && mouseX < lbl.x + tw &&
        mouseY < lbl.y && mouseY > lbl.y - th
      ) {
        selectedLabel = lbl;
        labelOffsetX = mouseX - lbl.x;
        labelOffsetY = mouseY - lbl.y;
        return;
      }
    }

  } else {
    // 4. 일반 상태일 때: palette 부품 클릭 시 복제
    for (let i = palette.length - 1; i >= 0; i--) {
      let p = palette[i];
      if (isMouseOver(p)) {
        let copy = {
          name: p.name,
          img: p.img,
          x: mouseX,
          y: mouseY,
          w: p.w,
          h: p.h,
          isPalette: false
        };
        placed.push(copy);
        selectedPart = copy;
        offsetX = 0;
        offsetY = 0;
        return;
      }
    }
  }
}

function mouseDragged() {
  if (selectedPart) {
    selectedPart.x = mouseX - offsetX;
    selectedPart.y = mouseY - offsetY;
  }
    if (editPaletteMode && selectedLabel) {
    selectedLabel.x = mouseX - labelOffsetX;
    selectedLabel.y = mouseY - labelOffsetY;
  }

}

function mouseReleased() {
  selectedPart = null;
    selectedLabel = null;

}

function keyPressed() {
  // 'e' 키로 팔레트 편집 모드 전환
  if (key === 'r') {
  placed = [];
  selectedPart = null;
  print("모든 배치 초기화됨");
}

  if (key === 'e') {
    editPaletteMode = !editPaletteMode;
    print("Palette Edit Mode:", editPaletteMode);
  }

  // 선택된 부품 크기 조절 또는 삭제
  if (selectedPart) {
    if (keyCode === UP_ARROW) {
      selectedPart.w *= 1.1;
      selectedPart.h *= 1.1;
    } else if (keyCode === DOWN_ARROW) {
      selectedPart.w *= 0.9;
      selectedPart.h *= 0.9;
    } else if (keyCode === DELETE || keyCode === BACKSPACE) {
      let index = placed.indexOf(selectedPart);
      if (index !== -1) {
        placed.splice(index, 1);
        selectedPart = null;
      }
    }
  }

  // 선택된 텍스트 라벨 크기 조절
  if (selectedLabel) {
    if (key === "[") {
      selectedLabel.size = max(6, selectedLabel.size - 2);
    } else if (key === "]") {
      selectedLabel.size += 2;
    }
  }

  // 's' 키로 전체 저장
  if (key === "s") {
    saveJSON({ palette, placed, labels }, "placed_layout.json");
  }

  // 'l' 키로 palette + labels만 저장 (layout.json 업데이트용)
  if (key === "l") {
    let updatedPalette = palette.map(p => ({
      name: p.name,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h
    }));

    let updatedLabels = labels.map(lbl => ({
      text: lbl.text,
      x: lbl.x,
      y: lbl.y,
      size: lbl.size
    }));

    saveJSON([...updatedPalette, ...updatedLabels], "layout.json");
  }
}


function isMouseOver(p) {
  if (
    mouseX > p.x && mouseX < p.x + p.w &&
    mouseY > p.y && mouseY < p.y + p.h
  ) {
    // 이미지 내 상대 위치 계산
    let relativeX = Math.floor((mouseX - p.x) * (p.img.width / p.w));
    let relativeY = Math.floor((mouseY - p.y) * (p.img.height / p.h));

    let c = p.img.get(relativeX, relativeY); // [R,G,B,A]
    return c[3] > 0; // 알파값이 0보다 크면 보이는 부분
  }
  return false;
}


function scaleToFit(img, targetW, targetH) {
  let ratio = min(targetW / img.width, targetH / img.height);
  return {
    w: img.width * ratio,
    h: img.height * ratio
  };
}
