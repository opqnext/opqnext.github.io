(function () {
  "use strict";

  var Theme = {};

  Theme.backToTop = {
    register: function () {
      var $backToTop = $('#back-to-top');

      $(window).scroll(function () {
        if($(window).scrollTop() > 100) {
          $backToTop.fadeIn(1000);
        } else {
          $backToTop.fadeOut(1000);
        }
      });

      $backToTop.click(function () {
        $('body,html').animate({ scrollTop: 0 });
      });
    }
  };

  Theme.fancybox = {
    register: function () {
      if ($.fancybox){
        $('.post').each(function () {
          $(this).find('img').each(function () {
            $(this).wrap('<a class="fancybox" href="' + this.src + '" title="' + this.alt + '"></a>')
          });
        });

        $('.fancybox').fancybox({
          openEffect	: 'elastic',
          closeEffect	: 'elastic'
        });
      }
    }
  };

  Theme.titleBounce = {
    colors: ['#002FA7', '#81D8CF', '#003152', '#B05923', '#E60000', '#900021', '#FBD26A', '#8F4B28', '#01847F', '#40E0D0'],

    // Pick a random color, excluding a list of colors currently in use
    pickColor: function (excludeList) {
      var available = this.colors;
      if (excludeList && excludeList.length) {
        available = this.colors.filter(function (c) {
          return excludeList.indexOf(c) === -1;
        });
      }
      return available[Math.floor(Math.random() * available.length)];
    },

    // Collect current colors of all letters from their data-color attrs
    getUsedColors: function ($letters) {
      var used = [];
      $letters.each(function () {
        var c = $(this).attr('data-color');
        if (c) used.push(c);
      });
      return used;
    },

    getRandomInterval: function () {
      return 3000 + Math.random() * 17000; // 3-20 seconds
    },

    startRound: function ($letters) {
      var self = this;
      $letters.each(function (i) {
        var $letter = $(this);
        setTimeout(function () {
          // Re-read ALL letters' current colors at this moment,
          // so previous letters in this wave have already released their old colors
          var usedColors = self.getUsedColors($letters);
          var newColor = self.pickColor(usedColors);
          $letter.css('color', newColor);
          $letter.attr('data-color', newColor);
          $letter.css('animation', 'none');
          void $letter[0].offsetWidth; // force reflow
          $letter.css('animation', 'titleBounce 0.5s ease 0s 1 both');
        }, i * 550);
      });

      // Wait for all letters to finish, then schedule next round
      var lastDelay = ($letters.length - 1) * 0.55;
      var totalTime = (lastDelay + 0.5 + 0.1) * 1000;

      setTimeout(function () {
        setTimeout(function () {
          self.startRound($letters);
        }, self.getRandomInterval());
      }, totalTime);
    },

    register: function () {
      var $logo = $('.site-title .logo');
      if (!$logo.length) return;

      var text = $logo.text().trim();
      var self = this;

      // Shuffle colors so initial assignment is unique per letter
      var shuffled = self.colors.slice().sort(function () { return Math.random() - 0.5; });

      var html = '';
      for (var i = 0; i < text.length; i++) {
        var color = shuffled[i];
        html += '<span class="bounce-letter" style="color: ' + color + ';" data-color="' + color + '">' + text[i] + '</span>';
      }
      $logo.html(html);

      var $letters = $logo.find('.bounce-letter');

      // Start first round after a short delay
      setTimeout(function () {
        self.startRound($letters);
      }, 800);
    }
  };

  this.Theme = Theme;
}.call(this));
