// 默认奖项列表
var _prizeList = [
  {
    id: 1,
    name: '特等奖',
    winNum: 1,
    isRepeat: 0
  },{
    id: 2,
    name: '一等奖',
    winNum: 5,
    isRepeat: 0
  },{
    id: 3,
    name: '二等奖',
    winNum: 10,
    isRepeat: 0
  },{
    id: 4,
    name: '三等奖',
    winNum: 10,
    isRepeat: 0
  },{
    id: 5,
    name: '加码奖',
    winNum: 1,
    isRepeat: 0
  }
];
utils.storage.local.set('prizeList', utils.storage.local.get('prizeList') || _prizeList);
utils.storage.local.set('winnerHistory', utils.storage.local.get('winnerHistory') || []);

// 点击音效
var clickmic = document.getElementById('clickmic');
clickmic.volume = 0.5;
// 抽奖音效
var runingmic = document.getElementById('runingmic');
runingmic.volume = 0.3;
// 中奖音效
var winnermic = document.getElementById('winnermic');
winnermic.volume = 0.6;

var playMic = function(audio){
  setTimeout(function(){
    audio.pause();
    audio.currentTime = 0;
    audio.play();
  }, 50);
};

var stopMic = function(audio){
  clearInterval(audio.runtimeid);
  audio.pause();
  audio.currentTime = 0;
};


var vm = new Vue({
  el: document.body,
  data: function(){
    return {
      prizeTabId: '',   
      nameList: [],           // 抽奖名单
      currPrize: null,        // 当前奖项
      prizeList: [],          // 奖项列表
      newPrizeList: [],       // 新增奖项列表
      drawWinners: [],        // 本次中奖名单
      winnerHistory: [],      // 历史中奖名单
      isDrawing: false,       // 是否在抽奖
      isCanStop: false,       // 完成动画才能停止抽奖
      isStoping: false,
      isShowWinner: false,
      isShowHistory: false,
      isShowSettings: false
    }
  },
  ready: function(){
    var self = this;
    self.init();
    // 奖项列表
    self.prizeList = utils.storage.local.get('prizeList');

    $(window).on('resize', function(){
      clearTimeout(self.resizeTimeid);
      self.resizeTimeid = setTimeout(self.resetPosition, 500);
    });
  },
  methods: {
    init: function(){
      var self = this;
      // 初始化抽奖名单(模拟数据)
      // var nameList = [];
      // for (var i = 200; i > 0; i--) {
      //   nameList.push({
      //     id: i,
      //     name: '赖国聪'+i,
      //     dept: '技术部'+i,
      //     thumbnail: 'http://thecodeplayer.com/u/uifaces/'+ ((i-1)%50+1) +'.jpg',
      //     head: 'http://thecodeplayer.com/u/uifaces/'+ ((i-1)%50+1) +'.jpg',
      //     isWin: false
      //   });
      // }

      var promise = new Promise(function(resolve){
        $.getJSON('http://test.aylsonclub.com/ym/ym/getStaffList', function(response){
          if(response.success && response.data){
            resolve(response.data);
          }
        });
      });
      
      promise.then(function(nameList){
        // 判断抽奖名单是否已中过奖
        var winnerHistory = utils.storage.local.get('winnerHistory');
        nameList.forEach(function(item){
          item.thumbnail = 'staff/' + item.thumbnail;
          item.head = 'staff/' + item.head;
          winnerHistory.forEach(function(item2){
            if(item2.id === item.id){
              item.isWin = true;
              return true;
            }
          });
        });
        // 抽奖名单
        self.nameList = nameList;
        self.$nextTick(self.resetPosition);
      });
      
    },
    resetPosition: function(){
      var self = this;
      var $nameList = $('#name-list').find('.l-name-item')
        .css('transition', 'inherit')
        .css('transform', 'translate3d(0, 0, 0)');

      clearTimeout(self.positionTimeid);
      self.positionTimeid = setTimeout(function(){
        var position = {};
        self.nameList.forEach(function(item, index){
          position = $nameList.eq(index).position();
          item.top = position.top;
          item.left = position.left;
        });
        self.sort();
      }, 50);
    },
    // 乱序
    sort: function(){
      // 生成一个乱序数组
      var self = this;
      var randArr = [];
      var length = self.nameList.length;
      for (var i = length - 1; i >= 0; i--) {
        randArr.push(i);
      }
      randArr.sort(function(){
        return 0.5 - Math.random();
      });

      var x1,y1, x2,y2, x,y;
      $('#name-list').find('.l-name-item').each(function(index){
        x1 = self.nameList[index].left;
        y1 = self.nameList[index].top;

        x2 = self.nameList[randArr[index]].left;
        y2 = self.nameList[randArr[index]].top;

        x = x2-x1;
        y = y2-y1;

        $(this).css('transition', 'all 0.6s linear').css('transform', 'translate3d('+x+'px, '+y+'px, 0)');
      });
    },
    // 抽奖开始
    drawStart: function(){
      playMic(clickmic);
      var self = this;
      if(self.isDrawing) return;

      if(!self.currPrize){
        $('#prize-list').addClass('l-prize-tip');
        return;
      }

      self.isDrawing = true;
      self.isCanStop = false;
      self.sort();

      var allNum = self.nameList.length;                                // 抽奖总人数
      var isRepeat = Number(self.currPrize.isRepeat);                   // 是否可以重复抽奖
      var drawWinners = [];                                             // 本次抽奖中奖名单(数组下标)
      var winNum = Math.min(self.currPrize.winNum, allNum);             // 本次中奖人数
      var rand = 0;                                                     // 随机数

      // 判断抽奖人数是否大于本次中奖人数
      var drawNum = winNum;
      if(!isRepeat){
        var tempAllNum = self.nameList.filter(function(item){
          return !item.isWin;
        }).length;
        drawNum = Math.min(winNum, tempAllNum);
      }
      
      // 随机抽取中奖名单
      for(var i = 0; i < drawNum; i++){
        while(true){
          rand = Math.floor(Math.random() * allNum);
          if(drawWinners.indexOf(rand) === -1){
            // 如果可重复抽奖或者之前没中过奖
            if(isRepeat || !self.nameList[rand].isWin){ 
              drawWinners.push(rand);
              break;
            }
          }
        }
      }
      self.drawWinners = drawWinners;

      setTimeout(function(){
        $('#app').addClass('l-draw-start');
        self.drawing();
        self.isCanStop = true;
      }, 800);
    },
    // 抽奖中
    drawing: function(){
      var self = this;
      var allNum = self.nameList.length; 
      clearInterval(self.drawTimeid);
      self.drawTimeid = setInterval(function(){
        if(self.isDrawing){
          var rand = Math.floor(Math.random() * allNum);
          $('#name-list .l-active').removeClass('l-active');
          $('#name-' + rand).addClass('l-active');
        }else{
          clearInterval(self.drawTimeid);
        }
      }, 200);

      playMic(runingmic);
      runingmic.runtimeid = setInterval(function() { 
        runingmic.currentTime = 0; 
      }, 7000);
    },
    // 停止抽奖
    drawStop: function(){
      var self = this;
      if(!self.isCanStop || self.isStoping) return;

      var winnerHistory = utils.storage.local.get('winnerHistory');
      var promises = [];
      self.drawWinners.forEach(function(value){
        var promise = new Promise(function(resolve){
          // setTimeout(function(){
            $('#name-' + value).addClass('l-winner');
            var item = Object.assign({
              prize: self.currPrize.name,
              prizeId: self.currPrize.id
            }, self.nameList[value]);

            winnerHistory.push(item);
            resolve();
          // }, Math.random() * 3000);
        });

        promises.push(promise);
      });

      self.isStoping = true;
      playMic(clickmic);
      Promise.all(promises).then(function(){
        self.isStoping = false;
        self.isDrawing = false;
        self.isCanStop = false;

        stopMic(runingmic)
        playMic(winnermic);

        $('#name-list .l-active').removeClass('l-active');
        // 保存中奖名单
        utils.storage.local.set('winnerHistory', winnerHistory);
        // 显示中奖结果
        self.isShowWinner = true;

        // 播放烟花
        setTimeout(function(){
          $('#fireworks').fireworks({ 
            sound: true, // sound effect
            opacity: 0.8
          });
        }, 1000);
        
      }).catch(function(){
        stopMic(runingmic)
      });
    },
    // 关闭中奖弹窗
    closeDrawWinner: function(){
      var self = this;
      self.isShowWinner = false;
      var item = null;
      setTimeout(function(){
        $('#app').removeClass('l-draw-start');
        $('#name-list .l-active').removeClass('l-active');
        $('#name-list .l-winner').removeClass('l-winner');
        self.drawWinners.forEach(function(index){
          item = self.nameList[index];
          item.isWin = true;
          self.nameList.$set(index, item);
        });

        $('#fireworks').fireworks('stop');
      }, 500);
    },
    // 中奖名单tab
    prizeTabClick: function(id){
      this.prizeTabId = id;
      var winnerHistory = utils.storage.local.get('winnerHistory');
      if(!id){
        this.winnerHistory = winnerHistory;
      }else{
        this.winnerHistory = winnerHistory.filter(function(item){
          return item.prizeId === id;
        });
      }
    },
    // 显示中奖名单
    showHistoryList: function(){
      this.isShowHistory = true;
      this.prizeTabClick(this.prizeTabId);
    },
    // 清除中奖名单
    resetHistoryList: function(){
      utils.storage.local.set('winnerHistory_bak', utils.storage.local.get('winnerHistory'));
      utils.storage.local.set('winnerHistory', []);
      this.winnerHistory = [];
      this.isShowHistory = false;
      this.init();
    },
    // 显示奖项设置
    showPrizeSettings: function(){
      this.isShowSettings = true;
      this.newPrizeList = this.prizeList.concat();
    },
    // 增加奖项
    addPrize: function(){
      var length = this.newPrizeList.length;
      this.newPrizeList.push({
        id: length+1,
        name: '奖项名称',
        winNum: 1,
        isRepeat: 0
      })
    },
    // 删除奖项
    delPrize: function(prizeEntity){
      var newPrizeList = this.newPrizeList.filter(function(item){
        return prizeEntity.id !== item.id
      });
      this.newPrizeList = newPrizeList;
    },
    setNewPrizeList: function(){
      this.prizeList = this.newPrizeList.concat();
      utils.storage.local.set('prizeList', this.prizeList, 1000*3600*3);
      this.isShowSettings = false;
    },
    // 选择奖项
    sltPrize: function(prizeEntity){
      playMic(clickmic);
      $('#prize-list').removeClass('l-prize-tip');
      this.currPrize = prizeEntity;

    }
  }
});
