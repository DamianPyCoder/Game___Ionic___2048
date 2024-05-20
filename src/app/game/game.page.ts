import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Cell } from '../models/cell';
import { AnimationController, GestureController, GestureDetail, Animation, Platform } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { Share, ShareOptions } from '@capacitor/share';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage implements AfterViewInit {

  @ViewChild('boardGame', { read: ElementRef }) boardGame: ElementRef;
  public board: Cell[][];

  public rows: number[];
  public cols: number[];

  private direction: number;

  private DIRECTION_UP = 0;
  private DIRECTION_DOWN = 1;
  private DIRECTION_LEFT = 2;
  private DIRECTION_RIGHT = 3;

  private hasMovement: boolean;

  public points: number;
  private pointsRound: number;

  private animations: Animation[];

  private isMoving: boolean;

  constructor(
    private gestureController: GestureController,
    private alertService: AlertService,
    private translate: TranslateService,
    private animationsController: AnimationController,
    private platform: Platform
  ) {
    this.rows = Array(4).fill(0);
    this.cols = Array(4).fill(0);
    this.animations = [];
    this.newGame();
  }
  ngAfterViewInit(): void {

    const hSwipe = this.gestureController.create({
      el: this.boardGame.nativeElement,
      gestureName: 'hswipe',
      maxAngle: 30,
      direction: 'x',
      onEnd: (detail) => this.onHSwipe(detail)
    }, true)

    const vSwipe = this.gestureController.create({
      el: this.boardGame.nativeElement,
      gestureName: 'vswipe',
      maxAngle: 30,
      direction: 'y',
      onEnd: (detail) => this.onVSwipe(detail)
    }, true)

    vSwipe.enable();
    hSwipe.enable();

  }

  onHSwipe(detail: GestureDetail) {

    if (!this.isMoving) {

      this.isMoving = true;

      console.log("Horizontal");
      console.log(detail);

      if (detail.deltaX < 0) {
        console.log("Izquierda");
        this.direction = this.DIRECTION_LEFT;
        this.moveLeft();
      } else {
        console.log("Derecha");
        this.direction = this.DIRECTION_RIGHT;
        this.moveRight();
      }

      this.checkMove();
    }


  }

  onVSwipe(detail: GestureDetail) {

    if (!this.isMoving) {

      this.isMoving = true;

      console.log("Vertical");
      console.log(detail);

      if (detail.deltaY < 0) {
        console.log("Arriba");
        this.direction = this.DIRECTION_UP;
        this.moveUp();
      } else {
        console.log("Abajo");
        this.direction = this.DIRECTION_DOWN;
        this.moveDown();
      }

      this.checkMove();
    }

  }

  generateRandonNumber() {

    let row = 0;
    let col = 0;

    do {
      row = Math.floor(Math.random() * this.board.length);
      col = Math.floor(Math.random() * this.board[0].length);
    } while (this.board[row][col] != null);

    this.board[row][col] = new Cell();

    const probNum4 = Math.floor(Math.random() * 100) + 1;

    let background;
    if (probNum4 <= 25) {
      this.board[row][col].value = 4;
      background = '#eee1c9';
    } else {
      this.board[row][col].value = 2;
      background = '#eee4da';
    }

    const animation = this.animationsController.create()
      .addElement(document.getElementById(row + '' + col))
      .duration(500)
      .fromTo('background', 'rgba(238, 228, 218, .35)', background);

    animation.play();

    setTimeout(() => {
      animation.stop();
    }, 500);

  }

  moveLeft() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 1; j < this.board[i].length; j++) {
        this.processPosition(i, j);
      }
    }
  }

  moveRight() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = this.board[i].length - 2; j >= 0; j--) {
        this.processPosition(i, j);
      }
    }
  }

  moveUp() {
    for (let i = 1; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        this.processPosition(i, j);
      }
    }
  }

  moveDown() {
    for (let i = this.board.length - 2; i >= 0; i--) {
      for (let j = 0; j < this.board[i].length; j++) {
        this.processPosition(i, j);
      }
    }
  }

  nextPositionFree(rowOri: number, colOri: number, numberOriginal: number) {

    let rowNew: number;
    let colNew: number;
    let found: boolean;

    switch (this.direction) {
      case this.DIRECTION_LEFT:
        rowNew = rowOri;
        for (let j = colOri - 1; j >= 0 && !found; j--) {
          if (this.board[rowOri][j] != null) {
            found = true;

            if (this.board[rowOri][j].blocked) {
              colNew = j + 1;
            } else if (this.board[rowOri][j].value == numberOriginal) {
              colNew = j;
            } else if ((j + 1) != colOri) {
              colNew = j + 1;
            }


          }

        }

        if (!found) {
          colNew = 0;
        }

        break;
      case this.DIRECTION_RIGHT:
        rowNew = rowOri;
        for (let j = colOri + 1; j < this.board[rowOri].length && !found; j++) {
          if (this.board[rowOri][j] != null) {
            found = true;

            if (this.board[rowOri][j].blocked) {
              colNew = j - 1;
            } else if (this.board[rowOri][j].value == numberOriginal) {
              colNew = j;
            } else if ((j - 1) != colOri) {
              colNew = j - 1;
            }

          }

        }

        if (!found) {
          colNew = this.board[rowOri].length - 1;
        }


        break;
      case this.DIRECTION_UP:
        colNew = colOri;
        for (let i = rowOri - 1; i >= 0 && !found; i--) {
          if (this.board[i][colOri] != null) {
            found = true;

            if (this.board[i][colOri].blocked) {
              rowNew = i + 1;
            } else if (this.board[i][colOri].value == numberOriginal) {
              rowNew = i;
            } else if ((i + 1) != rowOri) {
              rowNew = i + 1;
            }

          }

        }

        if (!found) {
          rowNew = 0
        }

        break;
      case this.DIRECTION_DOWN:
        colNew = colOri;
        for (let i = rowOri + 1; i < this.board.length && !found; i++) {
          if (this.board[i][colOri] != null) {
            found = true;

            if (this.board[i][colOri].blocked) {
              rowNew = i - 1;
            } else if (this.board[i][colOri].value == numberOriginal) {
              rowNew = i;
            } else if ((i - 1) != rowOri) {
              rowNew = i - 1;
            }

          }

        }

        if (!found) {
          rowNew = this.board.length - 1;
        }

        break;
    }

    console.log("rowNew: " + rowNew);
    console.log("colNew: " + colNew);


    if (rowNew !== undefined && colNew !== undefined) {
      return [rowNew, colNew];
    }

    return null;

  }

  processPosition(i: number, j: number) {
    const cell = this.board[i][j];
    if (cell != null) {
      const nextPosition = this.nextPositionFree(i, j, cell.value);

      if (nextPosition) {

        const row = nextPosition[0];
        const col = nextPosition[1];

        if (!this.board[row][col]) {
          this.board[row][col] = new Cell();
        }

        if (cell.value == this.board[row][col].value) {
          const points = cell.value * 2;
          this.board[row][col].value = points;
          this.board[row][col].blocked = true;
          this.points += points;
          this.pointsRound += points;
        } else {
          this.board[row][col] = cell;
        }

        this.board[i][j] = null;

        this.hasMovement = true;

        let numberCells;
        switch (this.direction) {
          case this.DIRECTION_LEFT:
          case this.DIRECTION_RIGHT:
            numberCells = col - j;
            break;
          case this.DIRECTION_UP:
          case this.DIRECTION_DOWN:
            numberCells = row - i;
            break;
        }

        this.showAnimationMove(i, j, numberCells);

      }
    }
  }

  clearBlockedCells() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] != null) {
          this.board[i][j].blocked = false;
        }
      }
    }
  }

  checkMove() {

    if (this.winGame()) {
      this.alertService.alertCustomButtons(
        this.translate.instant('label.win.game.title'),
        this.translate.instant('label.game.content', { "points": this.points }),
        [
          {
            text: this.translate.instant('label.new.game'),
            handler: () => {
              this.newGame();
            }
          },
          {
            text: this.translate.instant('label.share'),
            handler: () => {
              this.sharePuntuation();
              this.newGame();
            }
          }
        ],
        false
      )
    } else if (this.loseGame()) {
      this.alertService.alertCustomButtons(
        this.translate.instant('label.lose.game.title'),
        this.translate.instant('label.game.content', { "points": this.points }),
        [
          {
            text: this.translate.instant('label.new.game'),
            handler: () => {
              this.newGame();
            }
          },
          {
            text: this.translate.instant('label.share'),
            handler: () => {
              this.sharePuntuation();
              this.newGame();
            }
          }
        ],
        false
      )
    } else if (this.hasMovement) {

      this.generateRandonNumber();

      this.hasMovement = false;

      if (this.pointsRound > 0) {
        this.showAnimationPoints();
        this.pointsRound = 0;
      }

      const animationGrouped = this.animationsController.create()
        .addAnimation(this.animations)
        .duration(100);

      animationGrouped.play();

      setTimeout(() => {
        animationGrouped.stop();
        this.animations = [];
      }, 100);

      setTimeout(() => {
        this.isMoving = false;
      }, 600);

      this.clearBlockedCells();
    }else{
      this.isMoving = false;
    }

  }

  winGame() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] != null && this.board[i][j].value == 2048) {
          return true;
        }
      }
    }
    return false;
  }

  loseGame() {

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] == null) {
          return false;
        }
      }
    }

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (
          (this.board[i - 1] && this.board[i - 1][j].value == this.board[i][j].value) ||
          (this.board[i][j + 1] && this.board[i][j + 1].value == this.board[i][j].value) ||
          (this.board[i + 1] && this.board[i + 1][j].value == this.board[i][j].value) ||
          (this.board[i][j - 1] && this.board[i][j - 1].value == this.board[i][j].value)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  newGame() {
    this.board = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ];
    this.generateRandonNumber();
    this.generateRandonNumber();
    this.points = 0;
    this.pointsRound = 0;
    this.hasMovement = false;
    this.isMoving = false;
  }

  showAnimationPoints() {

    const elementPoints = document.getElementById('pointsScored');

    elementPoints.innerHTML = '+' + this.pointsRound;

    const animation = this.animationsController.create()
      .addElement(elementPoints)
      .duration(1000)
      .fromTo('transform', 'translateY(0px)', 'translateY(-60px)')
      .fromTo('opacity', 0, 1);

    animation.play();

    setTimeout(() => {
      animation.stop();
      elementPoints.innerHTML = '';
    }, 1000);

  }

  showAnimationMove(row: number, col: number, numberCells: number) {

    let animation = this.animationsController.create()
      .addElement(document.getElementById(row + '' + col));

    switch (this.direction) {
      case this.DIRECTION_RIGHT:
      case this.DIRECTION_LEFT:
        animation = animation.fromTo('transform', 'translateX(0px)', `translateX(${numberCells * 60}px)`)
        break;
      case this.DIRECTION_UP:
      case this.DIRECTION_DOWN:
        animation = animation.fromTo('transform', 'translateY(0px)', `translateY(${numberCells * 60}px)`)
        break;
    }

    this.animations.push(animation);

  }

  async sharePuntuation(){

    const shareOptions: ShareOptions = {
      title: '2048',
      text: this.translate.instant('label.share.dialog.title', { points: this.points }),
      dialogTitle: this.translate.instant('label.share.dialog.title', { points: this.points})
    }

    if(this.platform.is('android')){
      shareOptions.url = 'https://play.google.com/';
    }else if(this.platform.is('ios')){
      shareOptions.url = 'http://apple.com/es/app-store';
    }

    await Share.share(shareOptions);

  }


}
