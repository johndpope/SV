/*!
 * Tranformer JavaScript to rawler data in the e-commerce site.
 * Version 0.1
 *
 * Date: 2015-07-09T09:47Z
 * Author: myvo85<at>gmail<dot>com
 */
if(typeof(window.startStock) === 'undefined' ){
  /**
   * Load a script from the outside.
   */
  function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
  }
  /**
  *Check url is image
  */
  function imageExists(url, callback) {
    var img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
  }

  /**
  * Compare Version jquery
  */
  function versioncompare(strVersionA, strVersionB){
    var arrVersionA = strVersionA.split('.');
    var arrVersionB = strVersionB.split('.');
    var intVersionA = (100000000 * parseInt(arrVersionA[0])) + (1000000 * parseInt(arrVersionA[1])) + (10000 * parseInt(arrVersionA[2]));
    var intVersionB = (100000000 * parseInt(arrVersionB[0])) + (1000000 * parseInt(arrVersionB[1])) + (10000 * parseInt(arrVersionB[2]));

    if (intVersionA > intVersionB) {
        return 1;
    }else if(intVersionA < intVersionB){
        return -1;
    }else{
        return 0;
    }
    return false;
  }

  /**
   * Transformer features, to display button on e-commerce site.
   */
  var TFR = {
    crlf: /\r?\n|\r|\t+|\s+/g,
    regexp_price: /^.*?(\$|USD)(\s+)?([\d+\.\,]+).*$/,
    hasPrice: function(element,detail){
      $(element).find('script').remove();
      var planText = $(element).text().replace(TFR.crlf,' ');
      if(typeof $(element[0]) !== 'undefined') {
        if(typeof $(element[0]).get(0) !== 'undefined') {
          var tagName = $(element[0]).get(0).tagName.toLowerCase();
          if(TFR.wrapper.ignorePriceString && tagName !== 'body' && tagName !== 'html') {
            var ignorePriceString = '';
            for (var i = 0; i < TFR.wrapper.ignorePriceString.length; i++) {
              ignorePriceString += TFR.wrapper.ignorePriceString[i] + "|";
            }
            ignorePriceString = ignorePriceString.slice(0, -1);
            if(ignorePriceString != '' && (new RegExp(ignorePriceString).test(planText))) {
              return false;
            }
          }
        }
      }
      return TFR.regexp_price.test(planText)
      || ($(element).find("[class*='Price'],[class*='price'],[class*='cost']").length
      && (TFR.regexp_price.test($(element).find("[class*='Price'],[class*='price'],[class*='cost']").text().replace(TFR.crlf,' '))));
    },
    getBestPrice: function(element){
      if($(element).length && $(element).text().trim().toLowerCase() == 'free') {
        return 0;
      }
      var ignorePrice = [];
      var price = {fontSize: 0,value: -1,'count': 0};
      $(":hidden", element).each(function(){
        if( /^\d+$/.test($(this).text().trim())){
          $(this).text(' ' + $(this).text());
        }
      });
      $($(":contains($), :contains(USD)", element).get().reverse()).each(function(index,e) {
        //if(price.count >= 5) return;

        if($('[class*="tfrContainer"]', e).length == 0){
          if(TFR.wrapper.priceAlter) {
            $(TFR.wrapper.priceAlter, e).each(function(index,el) {
              $(el).html($(el).html().trim().replace(/^(\d+)/,".$1"));
            });
          }
          if(TFR.wrapper.specialPrice) {
            var text = $(e).clone().children().remove().end().text().replace(TFR.crlf,' ').trim();
          } else {
            var text = $(e).text().replace(TFR.crlf,' ').trim();
          }
          if(TFR.regexp_price.test(text)){
            var fSize = parseInt($(e).css('font-size')),
                tName = $(e).prop("tagName").toLowerCase(),
                textdeco = $(e).css("text-decoration");
            priceVal = text.replace(TFR.regexp_price, "$3");
            if (price.fontSize <= fSize && textdeco != 'line-through' && (!$(e).is(':hidden')||TFR.wrapper.acceptHidden) && tName != 'del') {
              if(TFR.wrapper.priceAlter) {
                $(TFR.wrapper.priceAlter, e).each(function(index,el) {
                  if(priceVal.indexOf('.') < 0 && /^\.\d+$/.test($(el).text())){
                    priceVal = priceVal + $(el).text().replace(/^(\d+)/,".$1");
                  }
                });
              }
              if(ignorePrice.indexOf(priceVal) == -1 && $(e).parent().css("text-decoration") != 'line-through' && tName != 'del' && ((priceVal != price.value && parseFloat(priceVal) < parseFloat(price.value)) || price.fontSize < fSize)){
                if(price.value == -1 || text.replace(/\s+/g,'').indexOf('$'+price.value) ==-1){
                  price.fontSize = fSize;
                  price.value = priceVal;
                }
              }
              price.count++;
            }else if(textdeco == 'line-through' || price.fontSize > fSize || tName == 'del'){
              ignorePrice.push(priceVal);
            }
          }
        }
      });
      if(price.value == -1) {
        if(TFR.wrapper.getPriceFromElement) {
          //return element.parent().find('.dynamic_qty').val().trim().replace(TFR.crlf, ' ').replace(TFR.regexp_price, '$3')
          return element.text().trim().replace(TFR.crlf, ' ').replace(TFR.regexp_price, '$3');
        }
      }
      if (typeof price.value == 'string') {
        var priceVal = price.value.replace(/\.$/, '');
        if (priceVal.indexOf(',') != -1 && priceVal.indexOf('.') != -1) {
          if (priceVal.indexOf(',') < priceVal.indexOf('.')) {
            priceVal = parseFloat(priceVal.replace(/\,/g, ''));
          } else {
            priceVal = priceVal.replace(/\./g, '');
            priceVal = parseFloat(priceVal.replace(/\,/g, '.'));
          }
        } else if (priceVal.indexOf(',') != -1) {
          var tmp = priceVal.split(',');
          if (tmp.length > 2) {
            priceVal = parseFloat(priceVal.replace(/\,/g, ''));
          } else {
            if (tmp[1].length > 2) {
              priceVal = parseFloat(priceVal.replace(/\,/g, ''));
            } else {
              priceVal = parseFloat(priceVal.replace(/\,/g, '.'));
            }
          }
        } else if (priceVal.indexOf('.') != -1) {
          var tmp = priceVal.split('.');
          if (tmp.length > 2) {
            priceVal = parseFloat(priceVal.replace(/\./g, ''));
          } else {
            if (tmp[1].length > 2) {
              priceVal = parseFloat(priceVal.replace(/\./g, ''));
            }
          }
        }
        price.value = priceVal;
      }
      return price.value;
    },
    getPrice: function(element){
      var priceVal = '',price = 0;
      if($(element).hasClass('tfrContainerDetail')){//Detail item
        if(TFR.wrapper.priceInDetail){
          for(var i=0 ; i<TFR.wrapper.priceInDetail.length ; i++){
            price = TFR.getBestPrice($(TFR.wrapper.priceInDetail[i]));
            if(price > -1){
              return price;
            }
          }
        } else {
          if(TFR.wrapper.extPriceInDetail) {
            return $(TFR.wrapper.extPriceInDetail).text();
          }
        }
      }else if(TFR.wrapper.priceInList){
        for(var i=0 ; i<TFR.wrapper.priceInList.length ; i++){
          price = TFR.getBestPrice($(TFR.wrapper.priceInList[i],element));
          if(price > -1){
            return price;
          }
        }
      }
      price = TFR.getBestPrice(element)
      if(price > -1){
        return price;
      }
      return -1;
    },
    imgOkie: function($img){
      if($img.hasClass('tfr-processed') || (($img.is(':hidden')&&!TFR.wrapper.acceptImgHidden) && !$img.hasClass('svProduct'))) return false;
      if(TFR.ignoreThisImage($img)){
        $img.addClass('tfr-processed svIgnore');
        return false;
      }
      var imgSrc = $img.attr('src');

      if((typeof(imgSrc) == 'undefined' || (typeof($img.attr('class')) != 'undefined' && $img.attr('class').search(/[l|L]ogo/i) >= 0) )) {
        return false;
      }
      // if(typeof($img.data('src')) == 'undefined'){
      //   return false;
      // }
      var imgW = $img[0].naturalWidth <= 1?$img.width():$img[0].naturalWidth
        ,imgH = $img[0].naturalHeight <= 1?$img.height():$img[0].naturalHeight;
      if((imgW == imgH && imgH == 1) || imgW == 0){
        $img.load(function() {
          if(this.width <= 1 || this.height <= 1){
            $img.addClass('tfr-processed 4');
          }
        });
        return false;
      }
      /*if(Math.min(imgH,imgW) * 100/Math.max(imgH,imgW) < 10 ||  (imgW > imgH * 4)) {
        $img.addClass('tfr-processed 5');
        return false;
      }*/
      return ((imgW >= TFR.options.imgMinWidth) || (imgH >= TFR.options.imgMinHeight));
    },
    getProductTitle : function($element,$button){
      var productTitle = '';
      //Start hook alter
      if($button.data('container') == 'tfrContainerDetail'){//Detail item
        if(TFR.wrapper.titleDetail){
          $(TFR.wrapper.titleDetail).each(function(index,e) {
            productTitle = (productTitle+ ' ' + $(e).text() + ' ').trim();
            if($(e).css('text-transform') && $(e).css('text-transform') == 'uppercase')
              productTitle = productTitle.toUpperCase();
          });
        }else {
          productTitle = $('title').text().replace(TFR.crlf,' ').replace(/\s[\-|\|]\s.*$/ig,'');
        }
      }else{//list
        if(TFR.wrapper.title){
          for(var i=0 ; i<TFR.wrapper.title.length ; i++){
            if(TFR.wrapper.specialTitle) {
              productTitle = $(TFR.wrapper.title[i], $element).clone().children().remove().end().text().replace(/\s\s/g,'');
            } else {
              productTitle = $(TFR.wrapper.title[i], $element).text().trim();
            }
            if(productTitle){ break;}
          }
        }
        if(TFR.wrapper.joinTitle){
          for(var i=0 ; i<TFR.wrapper.joinTitle.length ; i++) {
            productTitle += ' '+$(TFR.wrapper.joinTitle[i], $element).clone().children().remove().end().text().replace(/\s\s/g, '');
          }
        }
      }
      if(productTitle != '' ) {
        return productTitle.replace(/\s+/g, " ");
      }
      //End hook alter
      $JtagA = $button.closest('a');
      if($JtagA.length){
        if (typeof ($JtagA.attr('data-title')) != 'undefined') {
          return $JtagA.attr('data-title');
        }else if(typeof ($JtagA.attr('title'))  != 'undefined'){
          productTitle = $JtagA.attr('title');
        }
      }
      $Jimg = $('img.tfr-processed',$button.parent());
      var imgAlt = (typeof ($Jimg.attr('alt')) != 'undefined' ? $Jimg.attr('alt') : (typeof ($Jimg.attr('title')) != 'undefined' ? $Jimg.attr('title') : ''));
      productTitle = (imgAlt.length > productTitle.length) ? imgAlt : productTitle;
      productTitle = productTitle.trim();

      if(productTitle != '' ) {
        return productTitle;
      }
      //General
      if ($('.title',$element).length == 1) {
        productTitle = TFR.getTheBestText($('.title',$element));
      }
      if (productTitle.length == 0) {
        if ($('[id*="title"],[id*="name"]',$element).length > 0) {
          productTitle = TFR.getTheBestText($('[id*="title"],[id*="name"]',$element));
        }else if ($element.find('[class*="title"], [class*="Title"]').length > 0) {
          productTitle = TFR.getTheBestText($element.find('[class*="title"], [class*="Title"]'));
        }
        else if ($element.find('[class*="name"], [class*="Name"]').length > 0) {
          productTitle = TFR.getTheBestText($element.find('[class*="name"], [class*="Name"]'));
        }
      }
      if (productTitle.length == 0) {
        if ($element.find('h1, h2, h3, h4').length > 0) {
          return (TFR.getTheBestText($element.find('h1, h2, h3, h4')));
        }
      }
      return (productTitle?productTitle:$element.find('p').text());
    },
    getDescription: function(container,detail){
      var desc = '';
      if(detail == true){
        if(TFR.wrapper.descInDetail){
          $(TFR.wrapper.descInDetail).each(function(index,e) {
            $(e).find('script').remove();
            if(typeof $(e).html() !== 'undefined') {
              desc = desc + $(e).html().trim() + "<br />";
            }
          });
          return desc;
        }
      }else if(TFR.wrapper.desc){
        $(TFR.wrapper.desc, container).each(function(index,e) {
          desc = desc + $(e).html().trim() + " ";
        });
        if(desc != '') return desc;
      }
      $(container).find("[class*='body']").each(function(index,e) {
        desc = desc + $(e).html().trim() + "<br />";
      });
      $(container).find("[id*='description'],[id*='detail'],[class*='description'],[class*='Description'],[class*='product-name'],[class*='summary']").each(function(index,e) {
        desc = desc + $(e).html().trim() + "<br />";
      });
      if(desc == ''){
        $(container).find("[id*='product-details'],[id*='description']").each(function(index,e) {
          desc = desc + $(e).html().trim() + "<br />";
        });
      }
      // if(detail!= 'undefined') return 'description';
      return desc.replace("\n",' ');
    },
    getContainer: function($img){
      var item = $img.parent(),level = 0;
      if(item.find('.stockIt-btn').length){
        $img.addClass('tfr-processed svHasIcon');
        return null;
      }
      if(TFR.wrapper.listContainer){
        var found = false;
        while(level < TFR.wrapper.maxCheckLevel){
          if(item.hasClass(TFR.wrapper.listContainer) || item.attr('id') == TFR.wrapper.listContainer){
            found = true;
            break;
          }
          item = item.parent();
          level++;
        }
        if(!found){
          var item = $img.parent(),level = 0;
        }
      }
      if (TFR.wrapper.ignoreTag && TFR.wrapper.ignoreTag.length) {
        TFR.wrapper.ignoreTag.forEach(function (tag) {
          if (item[0].tagName.toLowerCase() == tag) {
            item = item.parent();
            level++;
          }
        });
      }
      while(level < TFR.wrapper.maxCheckLevel && !TFR.hasPrice(item)){
        item = item.parent();
        if(item[0].tagName.toLowerCase() != 'span'){
          level++;
        }
        if(item.find('.stockIt-btn').length) {
          $img.addClass('tfr-processed 22');
          /*if( item.find('.stockIt-btn').data('container') != 'tfrContainerDetail'){
            $Jparent = $img.parent();
            $Jparent.addClass('stockIt-wrapper override');
            $Jparent.append(item.find('.stockIt-btn')[0].cloneNode(true));
            $Jparent.find('span.stockIt-btn').attr('style','');
          }*/
          return null;
        }
      }
      if($('[class*="banner"]',item).length == 0 ){
        if(level <= TFR.wrapper.maxCheckLevel ){
          return item;
        }
      }
      return null;
    },
    getDomainKey: function(){
      //this.location.domain.replace(/([^\.]+)(\.[a-z]{2,3})?(\.[a-z]{2,3})?$/ig, "$1").replace(/.*\.([^\.]+)$/,"$1").trim();
      var domainSplit = this.location.domain.split('.'),
      len = domainSplit.length;
      key = domainSplit[len - 2];
      if((key == 'com' || key== 'co') && len >=3 && domainSplit[len - 3]!= 'www' ) key = domainSplit[len - 3];
      return key;
    },
    getAbsoluteUrl: function(url) {
      url = this.adjustUrl(url);
      var link = document.createElement("a");
      link.href = url;
      link.host = (link.host.indexOf('www.') == -1 && !this.isSubdomain(link.host)) ? 'www.' + link.host : link.host;
      return encodeURI(decodeURI(link.protocol + "//" + link.host + link.pathname + link.search));
    },
    isSubdomain: function(url) {
      var regex = new RegExp(/^([a-z]+\:\/{2})?([\w-]+\.[\w-]+\.\w+)$/);

      return !!url.match(regex); // make sure it returns boolean
    },
    exportPriceInput: function() {
      if(TFR.wrapper.exportPriceInput && TFR.wrapper.exportPriceInput) {
        TFR.wrapper.exportPriceInput.forEach(function (el) {
          $(el).find('input').each(function(index){
            var content=$(this).val();
            $(el).append('<span style="display: none">'+content+'</span>');
          })
        });
      }
    },
    formatText: function() {
      if(TFR.wrapper.beforeText) {
        for (var i = 0; i < TFR.wrapper.beforeText.length; i++) {
          $(TFR.wrapper.beforeText[i]).each(function() {
            var bf = window.getComputedStyle(this, ':before').content;
            bf = bf.replace(/['"]+/g, '');
            if(bf !== '') {
              $(this).prepend("<b style='display:none'>"+bf+"</b>");
            }
          });
        }
      }
      if(TFR.wrapper.removeCommas) {
        TFR.wrapper.removeCommas.forEach(function(el) {
          $(el).each(function(index) {
            var priceText = $(this).text();
            priceText = priceText.replace(/,/g, '');
            $(this).text(priceText);
          })
        })
      }
    },
    offPlugin: function() {
      if(TFR.wrapper.offMasterSliderPlugin && TFR.wrapper.offMasterSliderPlugin.length){
        TFR.wrapper.offMasterSliderPlugin.forEach(function (el) {
          if(typeof window[el] !='undefined' && typeof window[el].api != 'undefined'){
            window[el].api.pause();
          }
        });
      }
    },
    removeHTML: function() {
      if(TFR.wrapper.removeHTML && TFR.wrapper.removeHTML.length){
        TFR.wrapper.removeHTML.forEach(function (el) {
          $(el).remove();
        });
      }
    },
    removeHTMLAlter: function() {
      if(TFR.wrapper.removeHTMLAlter && TFR.wrapper.removeHTMLAlter.length){
        TFR.wrapper.removeHTMLAlter.forEach(function (el) {
          $(el).remove();
        });
      }
      if(TFR.wrapper.removeTagHTMLAlter && TFR.wrapper.removeTagHTMLAlter.length){
        TFR.wrapper.removeTagHTMLAlter.forEach(function (el) {
          $(el).contents().unwrap();
        });
      }
    },
    changeHTML: function(){
      if(TFR.wrapper.unwrapHTML && TFR.wrapper.unwrapHTML.length){
        TFR.wrapper.unwrapHTML.forEach(function (el) {
          $(el).unwrap();
        });
      }
      if (TFR.wrapper.setLinkForImg && TFR.wrapper.setLinkForImg.length) {
        TFR.wrapper.setLinkForImg.forEach(function (obj) {
          $(obj.to).each(function () {
            var $img = $(this);
            var $container = $img;
            var i = 0;
            while (i < obj.checkLevel) {
              $container = $container.parent();
              i++;
            }
            $($container).find(obj.from).each(function () {
              var href = $(this).attr('href');
              $img.wrap( "<a href='"+href+"'></a>" );
            });
          });
        });
      }
      if(TFR.wrapper.removeTagHTML && TFR.wrapper.removeTagHTML.length){
        TFR.wrapper.removeTagHTML.forEach(function (el) {
          $(el).contents().unwrap();
        });
      }
      if(TFR.wrapper.onClick && TFR.wrapper.onClick.length) {
        TFR.wrapper.onClick.forEach(function (el) {
          $(el).click();
        });
      }
      if(TFR.wrapper.wrapContent && TFR.wrapper.wrapContent.length){
        TFR.wrapper.wrapContent.forEach(function (selector) {
          $(selector).each(function(i,el){
            var textEl = $(el).contents().filter(function () {
              return (this.nodeType == 3);
            });
            var textContent=textEl.text();
            textEl.remove();
            $(el).append("<span class='wrapContent'>"+textContent+"</span>");
          });
        });
      }
    },
    removeClass: function() {
      if(TFR.wrapper.removeClass) {
        for (var i = 0; i < TFR.wrapper.removeClass.length; i++) {
          $(TFR.wrapper.removeClass[i]).removeClass(TFR.wrapper.removeClass[i].substr(1));
        }
      }
    },
    commonStockIt: function(container = document) {
      if(TFR.wrapper.imgBackground){
        $(TFR.wrapper.imgBackground).each(function(index,e){
          if($(e).css('background-image') && !$(e).hasClass('tfrAppended')){
            $(e).addClass('tfrAppended').append('<img src='+$(e).css('background-image').replace(/^url\((.*)\)$/,"$1") +' class="svProduct" style="display:none"/>');
          }
        });
      }
      if(TFR.wrapper.imgLazyLoad){
        $(TFR.wrapper.imgLazyLoad).each(function(index,e){
          if($(e).parent().find('source[media="(min-width: 668px)"]').attr('srcset') && !$(e).parent().hasClass('tfrAppended')){
            $(e).parent().addClass('tfrAppended').append('<img src='+$(e).parent().find('source[media="(min-width: 668px)"]').attr('srcset').replace(/^url\((.*)\)$/,"$1") +' class="svProduct" style="display:none"/>');
          }
        });
      }
      // For product detail page.
      TFR.addBtnOnDetailPage();
      $.each(TFR.wrapper.arrList, function( index, value ) {
        $(value, container).each(function(index,e) {
          $img = $(e);
          if($img.hasClass('tfr-processed')) {
            return;
          }else{
            if($img.width()){// loaded
              if(TFR.imgOkie($img) && $img.width() <= 800){
                item = TFR.getContainer($img);
                if(item && item[0].tagName.toLowerCase() != 'body'){
                  if(TFR.hasPrice(item)) {
                    TFR.addButton($img,item);
                    return;
                  }else{
                    $img.addClass('tfr-processed noPrice');
                  }
                }
              }
            }
          }
        });
      });

      TFR.getStockItStatus();
      if(TFR.wrapper.removeFromChild && typeof TFR.wrapper.removeFromChild.child !== 'undefined'
        && typeof TFR.wrapper.removeFromChild.parent !== 'undefined'
        ) {
        $(TFR.wrapper.removeFromChild.parent).each(function(el){
          $(this).find(TFR.wrapper.removeFromChild.child).remove();
        })
      }
      $('.stockIt-wrapper .stockIt-btn',container).unbind('touchstart click').bind('touchstart click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if ($(this).hasClass('stocked') || $(this).hasClass('stocking')) {
          return ;
        }
        // Stock it.
        TFR.ajaxStockIt($(this));
        return false;
      });
    },
    prepareStockItData: function(postData) {
      // Make sure brand is the root-domain, not a sub-domain.
      var brand = this.location.domain.split('.'),
      len = brand.length;
      postData.brand = brand[len - 2] + '.' + brand[len - 1];
      postData.token = (typeof (access_token) === 'undefined' ? '' : access_token);
      postData.mid = TFR.options.mid;
    },
    ajaxStockIt: function($button) {
      postData = this.updateProductProperties($button);
      this.prepareStockItData(postData);
      postData.imageURLs = [postData.imgUrl];
      postData.price = postData.price.toString().replace(/,(\d{3})/ig,"$1").replace(/[\,|\.]$/ig,'').replace(/(.*\.\d{2}).*$/g,"$1");
      // Stock it.
      //console.log(postData);return;
      $button.attr('class','stockIt-btn stocking');
      $.ajax({
        url: TFR.services.baseUrl + 'api' + TFR.services.stockIt + '?access_token=' + postData.token,
        data: postData,
        dataType: 'json',
        type: 'POST',
        success: function(response) {
          var className = 'stocked error';
          if (response.error === null) {
            className = TFR.getClassNameStockIt(response.data);
          }
          $('.' + $button.data('container') + ' .stockIt-btn').each(function(){
            if($(this).data('container') == $button.data('container') ){
              $(this).attr('class','stockIt-btn stocked ' + className);
            }
          });
        },
        error: function (xhr, ajaxOptions, thrownError) {
          $('.' + $button.data('container') + ' .stockIt-btn').each(function(){
            if($(this).data('container') == $button.data('container') ){
              $(this).attr('class','stockIt-btn stocked error');
            }
          });
        }
      });
    },
    addBtnOnDetailPage: function() {
      if($('.tfrContainerDetail').length) return;
      if(TFR.wrapper.imgInDetail) {
        if( typeof(TFR.wrapper.imgInDetail) == 'string'){
          var imgObj = [{
            target: $(TFR.wrapper.imgInDetail)
          }];
        }else{
          var imgObj = [];
          for(var i = 0; i<TFR.wrapper.imgInDetail.length; i++){
            imgObj.push({
              target: $(TFR.wrapper.imgInDetail[i])
            });
          }
        }
      }else{
        var imgObj = [{
            w: TFR.options.imgDetailWidth,
            h: TFR.options.imgDetailHeight,
            target: null
        }];
        var newSize = {w:0,h:0};
        $('img').each(function() {//Find the largest image
          $img = $(this);
          if(TFR.imgOkie($img) && $img.width() <= 800){
            newSize.w = Math.max($img.width(),$img.parent().width());
            newSize.h = Math.max($img.height(),$img.parent().height());
            if ((imgObj[0].w < newSize.w || imgObj[0].h < newSize.h) && (newSize.w + newSize.h >=  (imgObj[0].w + imgObj[0].h))) {
              imgObj[0].w = newSize.w;
              imgObj[0].h = newSize.h;
              imgObj[0].target = $img;
            }
          }
        });
      }
      if(TFR.wrapper.removeDetailAttr && TFR.wrapper.removeDetailAttr.length) {
        TFR.wrapper.removeDetailAttr.forEach(function(el) {
          if(el.attr && el.attr.length) {
            el.attr.forEach(function(at) {
              $(el.selector).removeAttr(at);
            })
          }
        })
      }
      for(var i = 0; i<imgObj.length; i++){
        if (imgObj[i].target && imgObj[i].target.length) {
          $container = imgObj[i].target.parent();
          level = 0;
          while(level < TFR.wrapper.maxCheckLevelDetail && !TFR.hasPrice($container,true)){//&& ($container.find('[id*=category],[class*=banner]').length === 0 || $container.find('[id*=product],[class*=description]').length)
            $container = $container.parent();
            level++;
          }
          if(TFR.hasPrice($container,true) && $container[0].tagName.toLowerCase() != 'body'){
            TFR.addButton(imgObj[i].target, $container, true);
            break;
          }else{
            imgObj[i].target.addClass('tfr-processed detailNoPrice');
          }
        }
      }
    },
    getTheBestText: function($Jtarget) {
      var lastItem = {
        fontSize: 0,
        text: ''
      };
      $Jtarget.each(function() {
        var fSize = parseInt($(this).css('font-size')),
        textdeco = $(this).css("text-decoration");
        if (lastItem.fontSize <= fSize && textdeco != 'line-through') {
          lastItem.fontSize = fSize;
          if ($(this).find('*').length > 0) {
            $(this).find('*').each(function() {
              $(this).after("\n");
            });
          }
          lastItem.text = $(this).text().replace(/(\r\n|\r|\n)/g, ' ').replace(/\s\s+/g, ' ').trim();
        }
      });

      return lastItem.text;
    },
    updateProductProperties: function($button) {
      $Jcontainer = $('.' + $button.data('container'));
      if ($Jcontainer == null) {
        return;
      }
      var postData = {
        title: TFR.getProductTitle($Jcontainer, $button),
        imgUrl: $button.data('img'),
        originalUrl: $button.data('href'),
        price: TFR.getPrice($Jcontainer),
        description: TFR.getDescription($Jcontainer, $button.data('container') == 'tfrContainerDetail')
      };
      if ($button.data('container') == 'tfrContainerDetail' && TFR.wrapper.isCanvas) {
        var bg_url = $(TFR.wrapper.isCanvas)[0].style['background-image'];
        bg_url = /^url\((['"]?)(.*)\1\)$/.exec(bg_url);
        bg_url = bg_url ? bg_url[2] : "";
        var bg_urls = bg_url.split('?');
        postData.imgUrl = bg_urls[0];
      }
      if ($button.data('container') == 'tfrContainerDetail' && TFR.wrapper.setTargetImgDetail) {
        var src= $(TFR.wrapper.setTargetImgDetail).attr('src');
        if(src.indexOf('//')==0){
          postData.imgUrl = location.protocol+$(TFR.wrapper.setTargetImgDetail).attr('src');
        }else if(src.indexOf('/')==0){
          postData.imgUrl = location.host+$(TFR.wrapper.setTargetImgDetail).attr('src');
        }else if(src.indexOf(location.protocol)==0){
          postData.imgUrl = $(TFR.wrapper.setTargetImgDetail).attr('src');
        }
      }
      if(postData.imgUrl.indexOf('data://') >=0 ){
        postData.imgUrl = this.getAbsoluteUrl($button.parent().find('img.tfr-processed:first').attr('src'));
      }
      if(postData.description == ''||postData.description == '<br />') postData.description = postData.title;
      postData.originalUrl = this.getAbsoluteUrl(postData.originalUrl);
      return postData;
    },
    addButton: function($Jimg, item, detail) {
      if(TFR.wrapper.removeAttr && TFR.wrapper.removeAttr.length && typeof(detail) == 'undefined') {
        TFR.wrapper.removeAttr.forEach(function(el) {
          if(el.attr && el.attr.length) {
            el.attr.forEach(function(at) {
              $(el.selector).removeAttr(at);
            })
          }
        })
      }
      if( typeof($(item).attr('class')) != 'undefined' &&  $(item).attr('class').match(/tfrContainer/ig)) return;
      //var position = $Jimg.position();
      var targetTagName = $Jimg[0].tagName.toLowerCase();
      if(targetTagName == 'img'){
        imgSrc = $Jimg.attr('src');
        if(imgSrc&&imgSrc.indexOf('data:') == 0){
          if($Jimg.data('src')) {
            imgSrc = $Jimg.data('src');
          }
        }
        if(TFR.wrapper.anotherImgSrc&&!imgSrc){
          imgSrc = $Jimg.attr(TFR.wrapper.anotherImgSrc);
          if(imgSrc&&imgSrc.indexOf('data:') == 0){
            if($Jimg.data(TFR.wrapper.anotherImgSrc)) {
              imgSrc = $Jimg.data(TFR.wrapper.anotherImgSrc);
            }
          }
        }
      }else{
        imgSrc = $Jimg.css('background-image').replace( /url\(|\)/g, '');
      }
      if(typeof(imgSrc) == 'undefined') {
        return;
      }
      if(imgSrc.split("?").length > 2) {
        var nth = 0;
        imgSrc = imgSrc.replace(/\?/g, function(x, y,z){nth++; return (nth>1) ? "&" : x});
      }
      imgSrc = decodeURIComponent(imgSrc);
      if(targetTagName != 'a'){
          if($Jimg.closest('a').length){
            var $JtagA = $Jimg.closest('a') ;
          }else{
            var $JtagA =  $Jimg.parent();
            if($JtagA.find('a').length){
              $JtagA = $($JtagA.find('a')[0]);
            }
          }
      }else{
        var $JtagA = $Jimg;
      }
      $Jparent = $JtagA.parent();
      var containerId = 'tfrContainerDetail',btnDetail = '';
      if(typeof(detail) != 'undefined'){
        var productLink = TFR.adjustUrl(encodeURI(decodeURI(location.protocol + "//" + location.host + location.pathname + location.search)));
        TFR.options.detailLink = productLink;
        btnDetail = 'id="btnDetail"';
        if(TFR.wrapper.offZoomEventDetail&&TFR.wrapper.offZoomEventDetail.length){
          TFR.wrapper.offZoomEventDetail.forEach(function (el) {
            $(el).off();
          });
        }
        if(TFR.wrapper.offZoomPlugin){
          if(typeof MagicZoomPlus != 'undefined' && !jQuery.isEmptyObject(MagicZoomPlus)) {
            MagicZoomPlus.stop();
          }
          if(typeof MagicZoom != 'undefined' && !jQuery.isEmptyObject(MagicZoom)) {
            MagicZoom.stop()
          }
        }
      }
      else{
        if(typeof($JtagA.attr('href')) == 'undefined' || $JtagA.attr('href').toLowerCase().indexOf('javascript:') > -1 ) {
          $JtagA.mouseover();
          if(typeof($JtagA.attr('href')) == 'undefined' || $JtagA.attr('href').toLowerCase().indexOf('javascript:') > -1 ){
            if(TFR.wrapper.specialUrl) {
              $JtagA = $('#'+$Jimg.attr(TFR.wrapper.specialUrl));
            } else {
              if(!TFR.wrapper.exportUrlFromString) {
                $Jimg.addClass('tfr-processed svNoUrl');
                return;
              }
            }
          }
        }
        TFR.getLinkForProduct($JtagA);
        var productLink = TFR.adjustUrl(this.getAbsoluteUrl($JtagA.attr('href')));
        containerId = 'tfrContainer' + (this.total++);
      }
      var $Jbutton = $('<span '+btnDetail+' class="stockIt-btn" data-container="'+ containerId +'" data-href="'+ productLink +'" data-img="'+ this.getAbsoluteUrl(imgSrc) +'" style="display: none;">&nbsp;</span>');
      $(item).addClass(containerId + ' stockSVContainer' + TFR.key);
      $Jimg.addClass('tfr-processed');
      var classWrapper = 'stockIt-wrapper';
      if (targetTagName == 'img') {
        classWrapper += ' override';
      }

      if ($Jparent.css('border-radius') != '0px') {
        var top = (parseInt($Jparent.css('border-radius')) / 2) + 2;
        $Jbutton.css('top', top);
      }
      $Jimg.parent().addClass(classWrapper).append($Jbutton);
      TFR.options.product.urls.push(productLink);
      TFR.options.product.btns.push($Jbutton);
      $Jbutton.attr('class','stockIt-btn stocking').fadeIn();
      if (TFR.options.product.urls.length == TFR.options.maxCheckProdURLs) {
        TFR.getStockItStatus();
      }
    },
    getLinkForProduct: function($tagA) {
      var href = '';
      if(TFR.wrapper.attr && TFR.wrapper.attr != '' && ( $tagA.attr('href') == '' || $tagA.attr('href') == '#' )) {
        switch(TFR.wrapper.attr) {
          case 'data-attributes': {
            var value = $tagA.attr(TFR.wrapper.attr);
            try {
              var l = JSON.parse(value);
              var k = l.k, s = l.s;
              k = k.replace(/::/g, "-");
              k = k.replace(':', "");
              s = s.replace(':', "");
              href = k + '/' + s;
            } catch(e) {}
            break;
          }
          case 'onclick':
            var value = $tagA.attr(TFR.wrapper.attr);
            try {
              href = value.split(', \'')[1];
            } catch(e) {}
            break;
          }
        $tagA.attr('href',href);
      }
      if (TFR.wrapper.exportUrlFromString==1 && href == '') {
        switch (TFR.wrapper.attr) {
          case 'onclick':
            var value = $tagA.attr(TFR.wrapper.attr);
            try {
              href = value.split(', \'')[1].replace('\'','');
            } catch (e) {
            }
            break;
        }
        $tagA.attr('href',href);
      }

      return $tagA;
    },
    getStockItStatus: function() {
      if (TFR.options.product.urls.length == 0) {
        return ;
      }

      var postData = {
        'brand': true,
        'productUrls': TFR.options.product.urls
      }
      ,$Jbtns = TFR.options.product.btns;

      TFR.options.product.urls = [];
      TFR.options.product.btns = [];
      this.prepareStockItData(postData);
      $.ajax({
        url: TFR.services.baseUrl + 'api' + TFR.services.checkStatus + '?access_token=' + postData.token,
        data: postData,
        dataType: 'json',
        type: 'POST',
        success: function(response) {
          if(response.error != null){
            for (i = 0; i < $Jbtns.length; i++) {
              if($Jbtns[i].data('container') == 'tfrContainerDetail') {
                $Jbtns[i].attr('class','stockIt-btn stocked error');
              }else{
                $('.' +  $Jbtns[i].data('container') + ' .stockIt-btn').each(function(){
                  $(this).attr('class','stockIt-btn stocked error');
                });
              }
            }
          }else{
            for (i = 0; i < response.data.length; i++) {
              var className = TFR.getClassNameStockIt(response.data[i]);
              if($Jbtns[i].attr('data-container') == 'tfrContainerDetail') {
                $Jbtns[i].attr('class','stockIt-btn ' + className);
              }else{
                $('.' +  $Jbtns[i].attr('data-container') + ' .stockIt-btn').each(function(){
                  $(this).attr('class','stockIt-btn ' + className);
                });
              }
            }
          }
        },
        error: function (xhr, ajaxOptions, thrownError) {
          for (i = 0; i < $Jbtns.length; i++) {
            if($Jbtns[i].attr('data-container') == 'tfrContainerDetail') {
                $Jbtns[i].attr('class','stockIt-btn stocked error');
            }else{
              $('.' +  $Jbtns[i].attr('data-container') + ' .stockIt-btn').each(function(){
                $(this).attr('class','stockIt-btn stocked error');
              });
            }
          }
        }
      });
    },
    getClassNameStockIt: function(data) {
      className = 'icon-exclusive-available';
      if(data.status == -1){
        className = 'stocked error';
      }else{
        switch(data.location){
          case 'none':
            if(data.exclusive == 'available' || data.exclusive == 'none'){
              className = 'icon-exclusive-no';
            }else if(data.exclusive == 'other'){
              className = 'icon-exclusive-available';
            }
            break;
          case 'store':
            if(data.exclusive == 'player'){
              className =  'icon-shop-exclusive-yes stocked';
            }else if(data.exclusive == 'other'){
              className = 'icon-shop-exclusive-not-available stocked';
            }
            else if(data.exclusive == 'available' || data.exclusive == 'none'){
              className = 'icon-shop-exclusive-available';
            }
            break;
          case 'stock':
          case 'stockroom':
            if(data.exclusive == 'available' || data.exclusive == 'none'){
              className = 'icon-stockroom-exclusive-no';
            }else if(data.exclusive == 'other'){
              className = 'icon-stockroom';
            }
            break;
        }
      }
      return className;
    },
    toggleStockItBtn: function() {
      this.commonStockIt();
      $('.stockIt-wrapper .stockIt-btn').toggle();
    },
    getMidOfLSCallback: {
      autopartswarehouse: 'cj',
      izabel: 39599,
      isabellaoliver: 35382
    },
    getMidOfLinkShare: function() {
      // @see:
      // http://cli.linksynergy.com/cli/publisher/links/bentobox/get_links/bookmarklet/
      var domainName = this.location.domain;

      // Detect to execute callback.
      var domainSplit = domainName.split('.'),
      len = domainSplit.length,
      callbackFn = domainSplit[len - 2];
      if (TFR.getMidOfLSCallback[callbackFn]) {
        return TFR.getMidOfLSCallback[callbackFn];
      }

      var lookupMid = function(x) {
        var x = x.toLowerCase(),
        key = 0;
        for (key = 0; key < midTable.length; key++) {
          var item = midTable[key],
          domains = item.dom.toLowerCase().split(',');
          for (var i = 0; i < domains.length; i++) {
            var dm = domains[i],
            pos = x.indexOf(dm);
            if (pos == 0 || (pos > 0 && x[pos - 1] == '.')){
              return item.mid;
            }
          }
        }
        return '';
      },
      mid = lookupMid(domainName);

      return mid;
    },
    getCjDeepLink: function() {
      var domainName = this.location.domain,
      key = 0;

      for (key = 0; key < cjTable.length; key++) {
        var dm = cjTable[key].toLowerCase(),
        pos = domainName.indexOf(dm);
        if (pos == 0 || (pos > 0 && domainName[pos - 1] == '.')) {
          return 'cj'; // cj is mid key.
        }
      }
      return '';
    },
    getFoDeepLink: function() {
      var domainName = this.location.domain,
      key = 0;
      for(key = 0; key < foTable.length; key++) {
        var item = foTable[key],
        domain = item.dom.toLowerCase(),
        pos = domainName.indexOf(domain);
        if(pos == 0 || (pos > 0 && domainName[pos - 1] == '.')) {
          return item;
        }
      }
      return '';
    },
    getMID: function() {
      if (typeof (midTable) == 'undefined'
        || typeof (cjTable) == 'undefined'
        || typeof (foTable) == 'undefined') {
        return -1;
      }
      var mid = TFR.getMidOfLinkShare();
      if (mid == '') {
        mid = TFR.getCjDeepLink();
      }
      if (mid == '') {
        mid = TFR.getFoDeepLink();
      }
      if (mid == '') {
        return -2;
      }
      return mid;
    },
    getBaseURL: function() {
      if($('script[src*="stockIt.js"]').length) {
        var paramURLs = $('script[src*="stockIt.js"]').attr('src').split('/');
      } else {
        var paramURLs = baseURL.split('/');
      }
      return paramURLs[0] + '//' + paramURLs[2] + '/';
    },
    getProviderLocation: function() {
      var hostname = '',
      protocol = window.location.protocol;

      if (typeof (window.location.host) != 'undefined') {
        hostname = window.location.host;
      }
      else if (typeof (window.location.hostname) != 'undefined') {
        hostname = window.location.hostname;
      }
      else if (typeof (window.location.href) != 'undefined') {
        var params = window.location.href.replace(/\b(http|https):\/\//, '').split('/');
        hostname = params[0];
      }
      else if (typeof (document.domain) != 'undefined') {
        hostname = document.domain;
      }

      return {
        "domain": hostname,
        "protocol": protocol,
        "baseUrl": protocol + '//' + hostname,
      };
    },
    ignoreThisImage: function($img){
      switch(TFR.key){
        case 'newegg':
          return  $img.parent().hasClass('img-banners-box') || $img.parent().hasClass('branding-featured-img') || $img.parent().hasClass('noline') || $img.parent().parent()[0].tagName.toLowerCase() == 'center' || $img.parent().parent().parent().hasClass('grpAside');
        case 'greatergood':
          return $img.parent().hasClass('siteLogo');
        case 'bestbuy':
          return $img.parent().parent().hasClass('casc-spot-img')||$img.parent().parent().hasClass('polaroid-image')||$img.parent().hasClass('moduleBackground')||$img.parent().parent().hasClass('image-shell');
        case 'neimanmarcus':
          return ($img.parent()[0].tagName.toLowerCase() == 'picture') || $img.parent().hasClass('storeModule');
        case 'jcpenney':
          return $img.parent().parent().hasClass('editorial_container') || $img.parent().attr('title') == 'JCPenney Home';
        case 'brandsmartusa':
          return ($img.parent().parent().attr('id') == 'applytoday');
        case 'efaucets':
          return $img.parent().parent().hasClass('masonry-brick');
        case 'lego':
          return $img.parent().hasClass('brand-link');
        case 'kohls':
          return $img.parent().parent().attr('id') == 'kohls_logo' || $img.hasClass('box-bg-image');
        case 'stevemadden':
          return $img.parent().hasClass('productFlyout');
        case 'walgreens':
          return typeof($img.parent().parent().attr('class'))  == 'undefined';
        case 'thepopcornfactory':
          return $img.parent().parent().parent().attr('id') == 'nh-bar';
        case 'containerstore':
          return ((typeof($img.attr('src')) !='undefined' && $img.attr('src').indexOf('rating.gif') > 0) || $img.parent().parent().hasClass('merchandising-display'));
        case 'lillianvernon':
          return ($img.attr('id') == 'logo');
        case 'oneill':
          return $img.parent().parent().parent().hasClass('home-content__item');
        case 'aliexpress':
          return $img.parent().hasClass('collections-left-panel') || $img.parent().parent().parent().hasClass('item-inner') || $img.parent().parent().parent().parent().parent().hasClass('today-deal-dos-new');
        case 'abesofmaine':
          return $img.attr('alt') == 'Add to Cart' || $img.parent().parent().hasClass('rec_acc_suppwrap');
        case 'us-mattress':
          return $img.parent().attr('id') == 'mattress-expert-banner-copy' || $img.parent().attr('id') == 'merchTopOfPage' || $img.parent().hasClass('bn_g_container_usmat-body2') || $img.hasClass('sales-banner') || $img.parent().parent().attr('id') == 'merchFooterResults' || $img.parent().attr('id') == 'sli_poweredby';
        case 'officedepot':
          return $img.parent().attr('id') == 'dc_top_banner_landing' || $img.parent().hasClass('adTileBlock') || $img.parent().parent().hasClass('adTileBlock');
        case 'designerliving':
          return $img.parent().attr('id') == 'logo';
        case 'isabellaoliver':
          return $img.hasClass('_imagemap');
        case 'samsclub':
          return $img.parent().parent().hasClass('sms-ad');
        case 'justmysize':
          return $img.hasClass('IBMRecommendation-product-listing-image-justmysize');
        case 'beautybridge':
          return $img.hasClass('thin-cat-banner')||$img.parent().hasClass('category-products');
        case 'campingworld':
          return $img.parent().parent().attr('mbox') == 'searchleft';
        case 'jewelry':
          return $img.parent().parent().hasClass('grid-promo');
        case 'forever21':
          return $img.parent().parent().parent().parent().hasClass('ct_landing') || $img.parent().parent().parent().parent().parent().hasClass('new_seofooter') || ($img.attr('class') && $img.attr('class').indexOf('curalate') > -1);
        case 'hobbytron':
          return $img.parent().parent().parent().attr('class') == 'txtcenter hide value_props' || $img.parent().hasClass('logo') || $img.parent().parent().parent().parent().parent().hasClass('holiday_guide') || ( $img.attr('alt') && ( $img.attr('alt').indexOf('Select') > -1  || $img.attr('alt') == 'Parts')) || $img.parent().parent().attr('id') == 'banner_sm'|| $img.parent().parent().attr('id') == 'dailydeal_banner';
        case 'crocs':
          return $img.parent().parent().attr('id') == 'crocmenu-doorbusters' || $img.parent().parent().parent().parent().parent().hasClass('hpHero-wrapper') || $img.parent().parent().hasClass('box');
        case 'sierratradingpost':
          return $img.parent().parent().hasClass('dottedBorderBackground');
        case 'chroniclebooks':
          return $img.parent().parent().hasClass('category-block-section');
        case 'zappos':
          return $img.parent().parent().parent().hasClass('productReviews');
        case 'birthdayinabox':
          return $img.parent().hasClass('two-column-content-block__link') || $img.hasClass('floater') || $img.parent().hasClass('addthis_button') || $img.parent().parent().hasClass('guide-section');
        case 'petco':
          return $img.parent().parent().parent().hasClass('spacer-sm-bottom');
        case 'thebodyshop':
        case 'thebodyshop-usa':
          return $img.parent().parent().parent().parent().hasClass('slider-wrapper');
        case 'wine':
          return $img.parent().parent().parent().hasClass('marketingBlocks') || $img.parent().hasClass('logo');
        case 'sharperimage':
          return $img.parent().hasClass('tablet-logo') ||$img.parent().parent().hasClass('conde-nast-promo') || $img.parent().parent().parent().hasClass('paypal-bill-me-later');
        case 'nunnbush':
          return $img.parent().parent().hasClass('logo');
        case 'beautybrands':
          return $img.parent().parent().hasClass('carousel');
        case 'macys':
          return $img.parent().hasClass('hl-image');
        case 'ralphlauren':
          return $img.parent().hasClass('brand-link') || $img.parent().attr('id') == 'logo';
        case 'tommy':
          return $img.attr('itemprop') == "logo" || $img.parent().parent().attr('data-ems-name') == 'category_header' || $img.parent().attr('id') == 'monetate_selectorBanner_86661c28_00';
        case 'francescas':
          return $img.parent().parent().parent().hasClass('ml-header-logo');
        case 'melissaanddoug':
          return $img.parent().hasClass('extended-nav--item-thumb');
        case 'sunjack':
          return $img.parent().hasClass('product-single__thumbnail');
        case 'macofalltrades':
          return $img.parent().parent().attr('id')=='header_logo';
        case 'tidebuy':
          return $img.parent().parent().parent().attr('id')=='header';
        case 'zaful':
          return $img.parent().parent().hasClass('right-pop');
        case 'surefit':
          return $img.parent().parent().hasClass('logo');
        case 'groopdealz':
          return $img.parent().parent().parent().hasClass('collapsed_header_elements');
        case 'scarletandjulia':
          return $img.parent().parent().hasClass('menu-item') || $img.parent().hasClass('logo')|| $img.parent().parent().hasClass('image-sans-titre');
        case 'kaplanmd':
          return $img.parent().parent().hasClass('logo');
        case 'saksfifthavenue':
          return $img.parent().hasClass('landing-page-navigation-ad');
        case 'deandeluca':
          return $img.parent().parent().parent().hasClass('content-block');
        case 'shoebuy':
          return $img.parent().parent().hasClass('hpg-promo-img')||$img.parent().parent().hasClass('body')||$img.parent().parent().parent().hasClass('category_title');
        case 'beckettsimonon':
          return $img.parent().attr('id') == 'miami-image';
        case 'moltonbrown':
          return $img.parent().parent().hasClass('logo');
        case 'bpisports':
          return $img.parent().parent().parent().parent().parent().hasClass('home-content');
        case 'citychiconline':
          return $img.parent().parent().parent().hasClass('sidebar');
        case 'zooshoo':
          return $img.parent().parent().parent().parent().parent().hasClass('collection-listing')||$img.parent().parent().parent().hasClass('category-image');
        case 'na-kd':
          return $img.parent().parent().parent().parent().hasClass('productSidebar-description')||$img.parent().parent().hasClass('views-catalog-topSellers-item');
        case 'joann':
          return $img.parent().parent().parent().parent().hasClass('onlinedeals-wrapper')||$img.parent().parent().parent().parent().parent().hasClass('onlinedeals-wrapper');
        case 'orvis':
          return $img.parent().parent().hasClass('ModernLogoHotSpot') || $img.parent().parent().attr('id') == 'rewards' || $img.parent().parent().hasClass('s_lvl4');
        case 'panasonic':
          return $img.parent().parent().hasClass('lazyload');
        case 'createandcraft':
          return $img.parent().hasClass('sub-hero-1');
        case 'bonton':
          return $img.parent().parent().hasClass('creative_tpr');
        case 'artisticlabels':
          return $img.parent().attr('id') == 'hdr_logo';
        case 'budgetpetcare':
          return $img.parent().parent().hasClass('Our_guaranteeDiv');
        case 'rockler':
          return $img.parent().parent().attr('id')=='product-description-container';
        case 'joefresh':
          return $img.parent().attr('data-title')=='ACTIVEWEAR SALE';
        case 'waterford':
          return $img.parent().parent().hasClass('trioContainer')||$img.parent().parent().parent().hasClass('section');
        case 'wedgwood':
          return $img.parent().parent().hasClass('trioContainer');
        case 'royalalbert':
          return $img.parent().parent().parent().hasClass('category-list');
        case 'pandahall':
          return $img.parent().parent().parent().hasClass('BannerList')||$img.parent().parent().hasClass('Logo')||$img.parent().parent().parent().hasClass('BannerWrap')||$img.parent().parent().hasClass('ProductBanner');
        case 'reeds':
          return $img.parent().parent().hasClass('promotionBox');
        case 'royaldoulton':
          return $img.parent().parent().hasClass('collection');
        case 'champssports':
          return $img.parent().parent().hasClass('footer-icons');
        default:
          return $img.parent().hasClass('navbar-brand') || $img.parent().hasClass('test-free-trial') || $img.parent().hasClass('logo') ;
      }
      return false;
    },
    alterWrapper: function(){
      var alterArr = {};
      switch(TFR.key){
        case 'justmysize':
          alterArr = {'priceInList':['.product_price']};
          break;
        case 'barenecessities':
          alterArr = {maxCheckLevel: 2,'priceInList':['.price'],'imgInDetail': '#prodImg img:first','priceInDetail':['#product_details #spanOurPrice']};
          break;
        case 'sierratradingpost':
          alterArr = {'descInDetail': '.productInfoTabBody .col-sm-7', 'offZoomPlugin': true,'imgInDetail':'.primaryImageContainer a img'};
          break;
        case 'thepopcornfactory':
          alterArr = {maxCheckLevel: 2,title:['.nh-sm-feature-label h3'], 'imgBackground':'.ProductGrid_img .SquareImage','descInDetail':'#Pr-prodDescription','priceInDetail':['.multiSkuSelection','.singleSkuSelection'],'titleDetail':'.ProdTitle',imgInDetail: '.productColumn #wrap img'};
          break;
        case 'lillianvernon':
          alterArr = {maxCheckLevel: 4,'arrList': ['.thumbdiv a img'],'title':['.thumbInfo .thumbheader a'],'imgInDetail':['.detailImageSwatches .cloud-zoom img:first','.detailImage #mainimage'],'descInDetail':'span[itemprop="description"]'};
          break;
        case 'davidscookies':
          alterArr = {maxCheckLevel: 2,'desc': '.ProductGrid_name','imgInDetail': '.ProductPhotos_main img','imgBackground':'.ProductGrid_img .SquareImage','descInDetail':'.TwoColumn_main #main > div:eq(1)',priceInDetail:['.ProductSelect_item.is-active','.ProductDetail_price']};
          break;
        case 'ice':
          alterArr = {'imgInDetail':'.product-main-image img:first','descInDetail':'.product-page-alt .description'};
          break;
        case 'ladyfootlocker':
          alterArr = {maxCheckLevel: 2,'imgInDetail':'canvas','title':['.stockIt-wrapper']};
          break;
        case 'containerstore':
          alterArr = {maxCheckLevel: 6,maxCheckLevelDetail: 9,removeClass: ['.js-modal'], ignoreTag: ['a'], anotherImgSrc: 'data-src',descInDetail: '#pdp-text-container, .o-section-block-container .grid-container p[itemprop=description]', imgInDetail:['.slides li:first-child a img.js-zoom','.flex-active-slide img.zoomImg'], 'title': ['.o-block-title']};
          break;
        case 'esteelauder':
          alterArr = {maxCheckLevel: 2,'imgBackground':'.product_brief__image','imgInDetail':'.product-full__image img','descInDetail':'.spp-product__details-description'};
          break;
        case 'frenchconnection':
          alterArr = {maxCheckLevel: 1,maxCheckLevelDetail: 12,'priceInList': ['.product_price'],'imgInDetail':['#slider_main li:eq(0) img.first','a .zoomPad img.sel_colour:first','a .zoomPad img.first:first'],'descInDetail': '.product_information_details','priceInDetail':['#product_details #product_title_price', '#product_price'], 'specialPrice': '.product_price'};
          break;
        case 'bergdorfgoodman':
          alterArr = {maxCheckLevel: 2,'imgInDetail':'#prod-img .slick-slide:first img'};
          break;
        case 'walgreens':
          alterArr = {maxCheckLevel: 4,maxCheckLevelDetail: 11,'arrList': ['.thumbnail a>img'],'title':['.sr-only.ng-binding:first'],'imgInDetail':['#zoom-target #proImg','.productdisplay img:first','.product-dec-img .print-img img','#stylemaindisplayimage img:first','.photopanel-left img:first'], 'titleDetail':'.newProductDetailsPage .headTitle, #productName, .body-content .pgTitle', 'descInDetail':'#description-content, .descriptionText, #VPD_Description', removeHTML:['.terms']};
          break;
        case 'stevemadden':
          alterArr = {maxCheckLevel: 2,'descInDetail':'.detailsWrap','titleDetail':'.productNameGroup h1', imgInDetail: '#ProductImage .sliderWindow .altsClassName:first img', priceInDetail: ['#ProductSelections']};
          break;
        case 'guess':
          alterArr = {'beforeText': ['.price .priceVal.reg'],'checkMultiPrice':false, 'title':['.name', '.description.label-lpl','.description.label-plp'],'arrList': ['.image .productImage a img', '.image .prodImg a img'],'imgInDetail': '.productGradient  #myZoomView img:first,.swiper-slide.swiper-slide-active img:first','priceInDetail':['.price .sale .regular','.price .sale .original'],'descInDetail':'.productDescription'};
          break;
        case 'lordandtaylor':
          alterArr = {maxCheckLevel: 4,'imgInDetail': '.main_image #flyzoom','titleDetail':'.detial_right h2.detial', 'descInDetail':'.detial_main_content.pdp-details','priceInDetail':['.detial_pric.priceItems'], removeHTML: ['#contflyzoom'], removeCommas: ['.pro_price_black', '.pro_price_red']};
          break;
        case 'samsclub':
          alterArr = {'listContainer':'sc-product-card','title':['figcaption','.product-Details p.ttl a'],'priceAlter':'sup,.sc-cents,.superscript',removeCommas: ['.sc-dollars'], removeHTML: ['.product-Details .sc-price-strikethrough', '.product-Details .sc-promo-information'], 'imgInDetail': '#plImageHolder img , .highslide-gallery a img, .carousel_thumbs_item img:first, #ctl00_MainContent_CoverTypeImage','priceInDetail':['.bid-line', '.simplegift .details > form' , '.pricingInfo', '#base_price'],'descInDetail':'.itemDescription, .content_style, .auction-descriptions'};
          break;
        case 'overstock':
          alterArr = {maxCheckLevel: 2, 'title':['.info h3','.product-description p:first'],'imgInDetail': '.content-section .hero  img:first',priceInDetail:['.monetary-price-value', '.price'],'descInDetail':'#more .description'};
          break;
        case 'honest':
          alterArr = {maxCheckLevel: 2,maxCheckLevelDetail: 11,'title':['a.block.teal'],'titleDetail': 'h1.product-header','imgInDetail': '.js-pdp-main-carousel .slick-active  .pdp-carousel-img','priceInDetail':['.product-price-container:first','.col-md-12.col-sm-12.col-xs-6.no-padding'],'descInDetail':'.product-page-details'};
          break;
        case 'kohls':
          alterArr = {maxCheckLevel: 2,'title':['h3', '.product--description'],'imgInDetail': '.easyzoom img, #id_tcomPdpImageCont img.cls_tcomPdpImg.active','titleDetail':'.pdp-product-title','priceInDetail':['#pdp-Pricing'],'descInDetail':'.accordion-segment-content:first, .cls_shortTerm:first'};
          break;
        case 'gamestop':
          alterArr = {maxCheckLevel: 2,'arrList': ['.mainitem a img', '.product_image a img', '.pod a img'],'title':['h3'],'priceAlter':'sup','imgInDetail': '.layoutStandard  .boxart  .ae-img'};
          break;
        case 'thebodyshop':
        case 'thebodyshop-usa':
          alterArr = {maxCheckLevel: 1,'imgInDetail': '.content .left .visual img','descInDetail':'.product-infos', 'titleDetail':'h1.title', 'priceInDetail':['.priceOffersSection .price']};
          break;
        case 'bloomingdales':
          alterArr = {maxCheckLevel: 2, arrList:['.thumbnailItem a img', '.productImages a img'] ,desc:'#prodName a', imgInDetail: '#zoomerDiv img.PDPImageDisplayMain', descInDetail:'#pdp_tabs_body_details','priceInDetail':['#PriceDisplay .singleTierPrice'], removeCommas: ['.priceSale'] };
          break;
        case 'mattel':
          alterArr = {maxCheckLevelDetail: 10,'imgBackground':'.sm-hotitems-container.hidden-xs .section-container','title':['.item-description'],'imgInDetail': '#carouselContainer .rsActiveSlide img','descInDetail':'.product-fetaure','priceInDetail':['#floatingProductInfo .price_display .price']};
          break;
        case 'bestbuy':
          alterArr = {ignorePriceString:['Shop Now'],setLinkForImg: [{from:'.info-block h3 a', to:'.top-tech-image-wrapper img', checkLevel: 2}],maxCheckLevel: 4, imgInDetail: '#carousel-main img:first', arrList:['.offer-wrap .image-shell-wrapper a img','a img']};
          break;
        case 'walmart':
          alterArr = {maxCheckLevelDetail: 12,'arrList':['img.product-image','.Tile img.Tile-img','a img'],'title': ['.Tile-heading','.tile-heading'],'descInDetail':'.product-short-description','imgInDetail':'.js-product-primary-image, .prod-HeroImage-image.prod-HeroImage-imageZoomable, .choice-hero-non-carousel .choice-hero-item-border img:first'};
          break;
        case 'ashleyfurniturehomestore':
          alterArr = {title: ['h3.description[itemprop="name"]'],maxCheckLevel: 4,maxCheckLevelDetail: 10,arrList:['.productImage a img', '.product-grid-item a .product-grid-item__image--image img'], removeHTML:['.zoomContainer'],'descInDetail':'.paddingMobile .ProductDescription','imgInDetail': '.slides li:first .zoomImageContainer img','priceInDetail':['.priceColumn h4.Price']};
          break;
        case 'ewatches':
          alterArr = {'title': ['p'],'titleDetail': '.productAttributes > h1','imgInDetail': '.detailimage','priceInDetail':['.rtdetailsPromo','.productInfoSecondary'], 'descInDetail': 'strong .productDescription, .productDescription', 'offZoomPlugin': true, unwrapHTML:['#largeImage']};
          break;
        case 'brandsmartusa':
          alterArr = {maxCheckLevel: 2,'arrList':[".item-item a img"],'imgInDetail': '#imagePlus','priceInDetail':['.pdp-order .pdp-order-price strong'], 'offZoomPlugin': true};
          break;
        case 'greatergood':
          alterArr = {maxCheckLevel: 0,maxCheckLevelDetail:4,'arrList':['#product-list ul li a img','.slick-track .slick-slide a img'],'imgInDetail':'#productpic-selected','titleDetail':'#productName'};
          break;
        case 'beddinginn':
          alterArr = {'imgInDetail': '.lagerimg .bigpic.img0 img','descInDetail': '.tab_container #tab0', extPriceInDetail: '#allPrice'};
          break;
        case 'burpee':
          alterArr = {maxCheckLevel: 2,'imgInDetail': '.b-pdp_images-main_image:first','descInDetail': '.b-product_description'};
          break;
        case 'rockport':
          alterArr = {'arrList':['#QuickViewDialog img.primary-image:first','a img'],'imgInDetail':'#main img.primary-image:first','titleDetail': 'h1.product-name','descInDetail': '.mobile-toggle-content.toggle-content:first', 'priceInDetail': ['#product-content .product-price']};
          break;
        case 'efaucets':
          alterArr = {removeHTMLAlter: ['#ltkmodal-content'], maxCheckLevel: 2,'imgInDetail': '#Div5 img, .productimagearea .prodimagediv #test>img', 'descInDetail': '.productdescription','priceInDetail':['#productsale'], offZoomPlugin:true, unwrapHTML:['.MagicZoomPlus>img']};
          break;
        case 'panasonic':
          alterArr = {removeHTML: ['.new'],removeTagHTML: ['.price-sales sup'],'titleDetail': 'h1.product-name .pdp-prod-name','desc': '.product-name a.name-link','title': ['.product-name a.name-link'],'descInDetail': '.feature-content ul'};
          break;
        case 'orvis':
          alterArr = {'imgInDetail': '#product_image img', descInDetail: '.pg_description', title: ['#bottomurl .TNAIL_PFName'],'titleDetail': '#pf_title','priceInDetail':['.price']};
          break;
        case 'officialcostumes':
          alterArr = {imgInDetail: '#thumb_image_div img','descInDetail': '#sc-tab-details .infobox','titleDetail': '.productname','arrList': ['.product a img']};
          break;
        case 'nicandzoe':
          alterArr = {maxCheckLevel: 2, 'imgInDetail': '.bx-wrapper .slides img:first','descInDetail': '.accordion-section .accordion-body'};
          break;
        case 'kidsfootlocker':
          alterArr = {maxCheckLevel: 2,'title': ['.stockIt-wrapper']};
          break;
        case 'crocs':
          alterArr = {maxCheckLevel: 5,'title': ['.linkBlueText:last'],'desc': '.linkBlueText.productMiniMainLink','imgInDetail':'.productViewer #productHeroImg','descInDetail': '.productDetailsCont'};
          break;
        case 'ahava':
          alterArr = {exportUrlFromString: 1, attr: 'onclick',maxCheckLevel: 2,'title': ['h2.product-name > a'],imgInDetail: '.product-image #productImage','desc': '.a1-webreco-product-name a,.description','titleDetail': '.product-name h1','descInDetail':'.product-secondary .description:first'};
          break;
        case 'dblanc':
          alterArr = {'imgInDetail': '.product-image-wrap img:first','descInDetail':'.product-info .product-details'};
          break;
        case 'foreo':
          alterArr = {'imgInDetail': '.image-container-ecommerce li.active img,#lelo-gc-giftcard-preview img','descInDetail':'.body.field,.giftcard-form-desc','maxCheckLevel': 5,'priceInList': ['.commerce-price-savings-formatter-price'],'desc':'.field-items .field-item p,.views-field-field-gc-headline .field-content','titleDetail': '.node-title > span','arrList': ['.field-content img','.feat-product img','.view-content .views-row a img'],'specialUrl': 'data-automation-id','title': ['h3','.views-field-title span a','.views-field-field-colors .field-content','span.field-content']};
          break;
        case 'babyquasar':
          alterArr = {maxCheckLevel: 2,'imgInDetail': '.woocommerce-main-image.zoom > img','descInDetail':'div[itemprop=description]','titleDetail': 'h1[itemprop="name"]',loadScripts: ['http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/jquery-ui.min.js'], title: ['h3']};
          break;
        case 'gelpro':
          alterArr = {maxCheckLevel: 2,maxCheckLevelDetail: 9,'joinTitle':['.facets-item-cell-grid-details .grid-series','.facets-item-cell-grid-details .grid-subtitle','.facets-item-cell-grid-details .grid-pattern .grid-pattern-label','.facets-item-cell-grid-details .grid-pattern .grid-pattern-value'],'imgInDetail':'.item-details-image-gallery .zoomImg:first, .pdp-main-image-slider > li:nth-child(2) > img','descInDetail':'div[data-cms-area] .cms-content p.paragraph,.detail-series','priceInDetail':['.item-views-price:first'],titleDetail: '.header-content-left .detail-series, .header-content-left .detail-subtitle,.detail-pattern span'};
          break;
        case 'thewatchery':
          alterArr = {maxCheckLevel: 2};
          break;
        case 'jcpenney':
          alterArr = {maxCheckLevelDetail: 8,'specialUrl':'data-automation-id','descInDetail':'.pdp_brand_desc_info, .product-description.active','imgInDetail': 'img[data-automation-id="primary-image-pdp-0"]:first, #productimage-image','priceInDetail':['.ppPriceDetails','.pricing-row'], 'arrList': ['.gallery-image-block img', '.productDisplay_image--default', '.thumb img'], 'titleDetail': '#tproductinfo-name', 'title':['.details-wrapper h6.title'], priceInList:['.details-wrapper .pricing:not(.ng-hide)']};
          break;
        case 'zappos':
          alterArr = {maxCheckLevel: 1,'descInDetail': '#productDescription .description','imgInDetail':'#protagonist img','priceInDetail':['#priceSlot'], 'specialPrice': '.salePrice'};
          break;
        case 'jewelry':
          alterArr = {maxCheckLevel: 2,'arrList':['a>img'],'descInDetail':'.full-description','imgInDetail':'.main-product-image.product-image-zoom img'};
          break;
        case 'hobbytron':
          alterArr = {'priceInList': ['.right'],'imgInDetail':'.main_product .large_image img:first, .product_icons img:first','priceInDetail':['.price_modular .price .left']};
          break;
        case 'forever21':
          alterArr = {maxCheckLevelDetail:10, 'title':['.item_name_c'],'specialTitle': true,'imgInDetail':'.pdp_zoom .ItemImage.Main, #divImageGridForMen #pdp_mens_img_grid #liImageButton_0 img','descInDetail':'.description_wrapper','priceInDetail':['.pdp_title .price_p']};
          break;
        case 'nordstrom':
          alterArr = {maxCheckLevel: 2,'descInDetail': '.product-details-and-care', 'imgInDetail': '.immersive-gallery-zoom .main-content-image','priceInDetail':['.product-details .product-information .price-display']};
          break;
        case 'saksfifthavenue':
          alterArr = { isCanvas: '.s7swatches .s7thumb[state=\'selected\']', maxCheckLevelDetail: 9, imgInDetail: '#s7ZoomView', descInDetail: '.product-description',removeTagHTML: ['td>a.rr_link'], setLinkForImg: [{from:'.rr_link', to:'td .rr_image>.rr_home_img', checkLevel: 3}] ,'title':['.rr_item_text .bold'],'desc':'.rr_item_text .medium', removeCommas: ['.rr_price']};
          break;
        case 'lego':
          alterArr = {maxCheckLevel: 2,'imgInDetail':'.s7staticimage img:first','descInDetail':'.product-details__wrapper'};
          break;
        case 'absstyle':
          alterArr = {maxCheckLevel: 2,maxCheckLevelDetail: 3, 'arrList':['.product-image', '.product-image img'],'title':'.list-product-name', 'priceInDetail':['.special-price .price']};
          break;
        case 'avon':
          alterArr = {'arrList': ['.ImageAspect a img'], 'title': ['ProductSummaryName'], 'descInDetail': '#DetailTab_Description', 'priceInDetail': ['#Prices .SimplePrice'], 'imgBackground': '.zoomLens'};
          break;
        case 'campingworld':
          alterArr = {maxCheckLevelDetail: 5,'title':['span[itemprop="name"]'], 'priceInDetail': ['.low-price', '.price-info'], 'descInDetail': '.accordion-body, .main-block', 'imgInDetail': '#MagicMainImg img', 'offZoomPlugin':true}
          break;
        case 'mrbeer':
          alterArr = {'imgInDetail': '.gallery-image.image_0 img', 'descInDetail': '.content.active', 'desc': '.product-name a, .comparable-feature-list'}
          break;
        case 'isabellaoliver':
          alterArr = {'imgInDetail':'.thumbnail.selected img','title':['.desc h5 a'],'priceInList': ['.multi-price .blu-price.blu-price-initialised'], 'priceInDetail' : ['.dynamictype-single:first .multi-price .blu-price', '.multi-price .blu-price'], 'descInDetail': '#product-details-description'}
          break;
        case 'footaction':
          alterArr = {isCanvas: '.s7swatches .s7thumbcell .s7thumb[state=\'selected\']','priceInDetail': ['#product_price'],'title': ['.quickViewButtonWrap a','#product_name strong'],imgInDetail: '.s7zoomview,#product_images_spotlight img:first', descInDetail: '.product_description','titleDetail':'.pdp_title h1','arrList': ['.quickViewButtonWrap a img','.mbimgspan img','#product_image img']}
          break;
        case '6pm':
          alterArr = {maxCheckLevelDetail: 4,'imgInDetail': '#detailImageWrap img', 'priceInDetail': ['#priceSlot'], 'arrList': ['.product img'], 'descInDetail': '#prdInfoText'}
          break;
        case 'aliexpress':
          alterArr = {maxCheckLevelDetail: 5, 'priceInDetail': ['.product-price-main'], 'descInDetail': '.ui-box-body', 'imgInDetail': '.ui-image-viewer-thumb-frame img', 'titleDetail': '.product-name'}
          break;
        case '800florals':
          alterArr = {maxCheckLevel: 5, 'arrList': ['.specialLinks'], 'imgInDetail': '#Form3 table tbody tr:first td:first img,#Form1 table tbody tr:first td:first img', priceInDetail: ['#Form3 center table tbody tr td:has(input#radio[checked])']}
          break;
        case 'abesofmaine':
          alterArr = {titleDetail: '.detail-main > h1', 'maxCheckLevelDetail': 12,'imgInDetail': ['.2zoom:first img','#mainimg img'], 'priceInDetail': ['#prodpricewrapper .prodpricepad','.abes-price'], 'descInDetail': ['.tab-pane.active#description','#tab_description'], removeCommas: ['.price','.prodpricewrap .prodprice']};
          break;
        case 'officedepot':
          alterArr = {maxCheckLevel: 5,'titleDetail': 'h1[itemprop="name"]',imgInDetail: '#mainSkuProductImage','priceInList':['.price_amount','.unified_sale_price'],'arrList': ['.rr_item_image', '.photo a img', '.cm-non-adaptive-content','.products li img'],'priceAlter': '.small.decPrice:last,sup.pricing_format.fleft:last, .priceSup.decPrice, .tag_smallPrice:last, .supp_price.decPrice','descInDetail': '#descriptionContent','priceInDetail': ['.formatted_price'],'desc': '.desc_text a, .hide.skuDesc, .rr_item_name a,.rr_product_description_name a','title': ['.cm_product_description a','.rr_product_description a','.desc_text a'],'ignorePriceString': ['Shop Now']}
          break;
        case 'coldwatercreek':
          alterArr = {'imgInDetail': '.owl-item.active .product-image.main-image:first img.primary-image', 'priceInDetail': ['.mobile-toggle-content'], 'desc': '.name-link', 'descInDetail': '.shortDescription'}
          break;
        case 'ubiqlife':
          alterArr = {title: ['.product-name:nth-child(2)', '.product-name'],imgInDetail: '.product-img-owl .owl-stage-outer .owl-stage .owl-item.active img','titleDetail': '.product-name span:last', 'descInDetail': '.short-description', 'desc': '.product-name a'}
          break;
        case 'danskin':
          alterArr = {'priceInList': ['.wholesale-price'], 'priceAlter': '.wholesale-price', 'specialPrice': '.product-details .price.customer-price'}
          break;
        case 'us-mattress':
          alterArr = {loadScripts: ['https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js'],'imgInDetail': '#main-s-image','arrList': ['.image a img','.bn_g_result_image_link img', '.sli_grid_image a img', '.img a img'], 'descInDetail': '.tabContent:first, #review-copy-wrapper > p:nth-child(3)', removeHTML: ['#brand_logo']}
          break;
        case 'swissdiamond':
          alterArr = {'arrList': ['.prod-img img'], 'desc': '.product-name a'}
          break;
        case 'payless':
          alterArr = {'desc': '.name-link', 'titleDetail': '.product-name-text','arrList': ['.thumb-link img', '.image-link img.image'], 'imgInDetail': '.zoomPad img#primary-image, .image-detail[data-position=0]:first img', 'priceInDetail': ['.product-pricing-contain .product-price','.product-price' ], 'descInDetail': '#prod-detail-info'}
          break;
        case 'hushpuppies':
          alterArr = {maxCheckLevelDetail: 10,removeDetailAttr: [{selector: '.thumb.selected.flex-active-slide a',attr: ['href'] }], 'desc': '.name-link', 'title': ['.name-link'], 'imgInDetail': '.flex-active-slide .main-product-image .primary-image:first', 'priceInDetail': ['.product-price'], 'titleDetail': '.product-name-v2', 'descInDetail': '.pdp-drawer-content'}
          break;
        case 'paulfredrick':
          alterArr = {maxCheckLevel: 4,'arrList': ['.category', '.productimagelink picture img'], 'descInDetail': '.product-detail-list', 'imgInDetail': '#inner-zoom'}
          break;
        case 'designerliving':
          alterArr = {'specialPrice': '.exhibit p', 'priceAlter': 'sup:first',imgInDetail:'.picwrap img:first', 'descInDetail': '.Description', unwrapHTML: ['.picwrap a img'], removeHTML: ['.picwrap img:not(:first-child)'], offZoomPlugin: true};
          break;
        case 'fameandpartners':
          alterArr = {maxCheckLevel: 1,maxCheckLevelDetail: 8,'arrList':['.img-product', '.media-wrap img'],'desc': '.name', 'imgInDetail': '.zoomImg:first','descInDetail': '.panel-side-wrap','priceInDetail':['.btn-wrap'],'offZoomEventDetail':['.media-wrap']};
          break;
        case 'filthyfragrance':
          alterArr = {maxCheckLevel: 6, 'arrList':['.ls-image-wrap .ls-image','.prod-container img','.owl-item>a>img','.isp_product_image_wrapper .isp_product_image'],'offZoomEventDetail':['#product-photos >div'],'titleDetail':'#product-description>h1','priceInList':['.isp_product_price_wrapper .isp_product_price'],'title':['.isp_product_title']};
          break;
        case 'eglobalcentral':
          alterArr = {maxCheckLevel: 3,maxCheckLevelDetail:3, 'arrList':['td form a img','.product-image a img', '.RecSINS-W-ItemsDIV .RecSINS-W-ItemsImage a img'],'title':['.RecSINS-W-ItemsLine1 a'],desc: '.product-title-wrap .product-title', 'imgInDetail':'.cm-image-wrap a:not(.hidden) img','descInDetail':'.mainbox-title','priceInDetail':['.col-right .prices-container']};
          break;
        case 'fragrancenet':
          alterArr = {ignorePriceString: ['currently sold out'] ,maxCheckLevel: 3,maxCheckLevelDetail:5, 'arrList':['.productImage a img','.columnContain .product a img','.crsl-items figure .crsl-item .upsellItem a img'], 'imgInDetail':'#productImageContainer .mainProductImage','descInDetail':'#brandDescription', titleDetail: ['.brandTitle span.productTitle', '.brandTitle #variantInfo'], removeHTML: ['.fnetPromise.authenticBadge', '.freeShipBanner.fnetPromise .text .small'], title: ['.info p'], priceInDetail: ['.ourPrice.right.cf']};
          break;
        case 'magix':
          alterArr = {maxCheckLevelDetail: 4, removeHTML: ['.bembel span:first-child'] ,setLinkForImg:[{from:'.hidden-xs p > a', to: '.mgx-small .packshot img', checkLevel: 3}] ,'desc': '.contentWrapper p', 'arrList': ['.img-packshot','a .packshot img'], 'imgInDetail': '.orderbox .row .packshot > img.img-packshot:first', 'priceInDetail': ['.priceWrapper:first'], 'descInDetail': '.right .hidden-xs'}
          break;
        case 'beautybridge':
          alterArr = {maxCheckLevel: 2,'arrList':['.card-image', 'a img'], desc: '.product-name a,.card-title a', titleDetail: '.productView-title', priceInDetail:['.price-section'], 'removeClass': ['.productView-image'], removeHTML: ['.free-shipping-over']};
          break;
        case 'shopfonsandporter':
          alterArr = {maxCheckLevel: 2,maxCheckLevelDetail:2,'arrList':['#area_middle_center table tr td a img'], 'imgInDetail':'#area_middle_center tr td:not(.normaltext,.smalltext)>a>img','getPriceFromElement':true,'exportPriceInput':['.productprice'], 'descInDetail':'.tfrContainerDetail td.normaltext'};
          break;
        case 'wine':
          alterArr = {'beforeText': ['.price','.regularPrice','.salePrice'], 'imgInDetail': '.heroModule img.hero','descInDetail': '.productContent', 'removeClass': ['.mouseEvents'], 'priceInDetail':['.productAbstract .productPrice']}
          break;
        case 'maccosmetics':
          alterArr = {maxCheckLevel:4, 'arrList':['.product__image-medium a img']}
          break;
        case 'petco':
          alterArr = {'desc': '.mw-product-name', 'imgInDetail': '.mw-pdp-image img', 'descInDetail': '#description .panel-body'}
          break;
        case 'chroniclebooks':
          alterArr = {'descInDetail': '.more-details', desc:'.product-content .product-name a'}
          break;
        case 'birthdayinabox':
          alterArr = {'desc': '.product-summary__name a', 'imgInDetail':'.product-details__primary-image-button-image','titleDetail': '.product-details__heading','descInDetail': '.product-description__content-panel'}
          break;
        case 'worldofwatches':
          alterArr = {'arrList':['.MB_PRODUCTSLOT .MB_PRODUCTIMAGELINK img','.product .image a img'], 'imgInDetail':'#productMainImage','descInDetail':'.insideContainer'};
          break;
        case 'sharperimage':
          alterArr = {maxCheckLevel:2, maxCheckLevelDetail: 6, imgInDetail:['#product_video img','#mainImage'], titleDetail: '.product-info__action-items header.product-cell > h1', removeHTML: ['.product-viewport-container #product_video']};
          break;
        case 'nunnbush':
          alterArr = {'offMasterSliderPlugin':['slider'],maxCheckLevelDetail:11, 'imgInDetail':['.ms-slide-container .ms-mask-frame .ms-sl-selected img','.mainImage #styleDetailImg'], 'priceInDetail':['#detail .price'],'removeHTML': ['.zoomContainer']};
          break;
        case 'mobstub':
          alterArr = {maxCheckLevelDetail: 5,removeClass:['.zoomContainer'], descInDetail:'[itemprop="description"]', imgInDetail:['.zoomWrapper img']};
          break;
        case 'medicalsupplydepot':
          alterArr = {imgInDetail:['#bigImgWrap img:first'], descInDetail:'#desc'};
          break;
        case 'dorcousa':
          alterArr = {maxCheckLevel: 2, removeHTML:['.p-price .RetailPriceValue'], imgInDetail:'.ProductThumbImage a img', descInDetail: '.ProductDescriptionContainer'};
          break;
        case 'beautybrands':
          alterArr = {maxCheckLevel: 4, imgInDetail:'.detailImage a img', removeHTML:['.mousetrap'], priceInDetail: ['#productPricing'],desc:'.thumbInfo .thumbheader a',descInDetail:'.detailheader2'};
          break;
        case 'frankandoak':
          alterArr = {imgInDetail:'.slick-track .slick-active img, #productImg .product__slider div:first>img', descInDetail: ['.product__details__desc'], removeHTML: ['.slick-prev']};
          break;
        case 'timex':
          alterArr = {desc: 'div.product-name a',imgInDetail: '.product-primary-image a img', descInDetail:'.product-info-left'};
          break;
        case '1800lighting':
          alterArr = {ignoreTag: ['a'], specialTitle: true, title: 'a', arrList:['.block-grid-item .result-img img','.slick-track a img','#productresp_rr a img'], removeCommas: ['.result-price span'], imgInDetail: '#product-gallery #cloud-hero-holder img:first', removeTagHTML:['.price-block span.sign','#itemprice1'], descInDetail: '#itemdescription1'};
          break;
        case 'art':
          alterArr = {arrList:['.galThumbContainer .galImageContainer .galImageCell a img'],imgInDetail:'.product-hero-image-wrapper img:first',descInDetail:'#desktop-productDetails .product-details', removeCommas: ['.stpPrice span']};
          break;
        case 'thelimited':
          alterArr = {maxCheckLevel: 4, descInDetail: '.PDP-details', imgInDetail: '.productimagearea img'};
          break;
        case 'newegg':
          alterArr = {maxCheckLevel: 6, maxCheckLevelDetail: 9, arrList:['.combo-item-img a img','.swiper-slide-active .itemGraphics a img','a img'],ignorePriceString: ['See price in cart'],desc:'span.descText:first',title:['a.item-title','.itemDescription'],descInDetail:'#grpDescrip_h',imgInDetail: '.grpAside .mainSlide img', priceInDetail: ['.price.price-main-product:not(.price-preview):last','.price.price-main-product', '.subscription-price  .price'], removeHTML:['.inactive']};
          break;
        case 'dillards' :
          alterArr = {titleDetail: '#product-title', descInDetail: '#description-panel > div.desktop-description'}
          break;
        case 'nike' :
          alterArr = {descInDetail: '.pi-pdpmainbody',removeHTML: ['.grid-item .grid-item-info .product-group-details'],imgInDetail: 'img.exp-id-imagegrid__image:first , .hero-image-container > img.exp-pdp-hero-image.active',offZoomEventDetail: ['.exp-pdp-product-image .hero-image-container'], desc: '.product-name .edf-font-size--regular'}
          break;
        case 'macys' :
          alterArr = {maxCheckLevel: 4, maxCheckLevelDetail:10 , arrList:['.m-product-recently-viewed-product a img','a img'],imgInDetail:'.swiper-slide-active>div>img', descInDetail: '#m-j-product-details', priceInDetail: ['.m-product-prices-container'],removeHTML:['']};
          break;
        case 'ralphlauren':
          alterArr = {imgInDetail: '#prod-img', removeHTML: ['.prod-brand-logo'], descInDetail: '.detail', title: ['span.name', '.recentlyViewedDetails a', 'h2 > a']}
          break;
        case 'target':
          alterArr = {imgLazyLoad: ['img.lazyloaded'], imgInDetail: '.slick-active[data-slick-index=0] a img, .js-showZoomImage[data-idx=0] img.single-image',removeHTML: ['.js-alreadyViewed'],title: ['.h-display-block', '.h-sr-only'], descInDetail: '.accordion--content:first', priceInDetail: ['#js-product-sr-id']}
          break;
        case 'shoebuy':
          alterArr = {maxCheckLevel: 6, imgInDetail: '#primary-image', descInDetail: '.product_information',  attr: 'data-attributes',onClick: ['.pt_swatch_block:nth-child(1) > .pt_swatch_wrap:nth-child(1) img', '.owl-item:nth-child(1) .pt_swatch_block:nth-child(1) > .pt_swatch_wrap:nth-child(1) img'], 'specialPrice': '.product_price'}
          break;
        case 'deandeluca':
          alterArr = {imgInDetail: '.owl-item.active img, #media-gallery-carousel>.item img',priceInDetail: ['.price-box'],maxCheckLevelDetail: 7, desc: '.product-info .product-name a', title: ['.product-info .product-name a','.product-info .product-name'],removeHTML:['.ribbons']};
          break;
        case 'dressilyme':
          alterArr = {maxCheckLevel: 4, ignorePriceString: ['Under'], imgInDetail:'.de_img ul li:first img', descInDetail: '.tab_info .item_con', priceInDetail:['.showPrice dl dt'], removeHTML:['.Line-through s'], titleDetail:'#detailsInfo h1' };
          break;
        case 'emmacosmetics':
          alterArr = {maxCheckLevel: 1, arrList:['.item a img'], title: ['h2.product-name a'], desc:'h2.product-name a', ignoreTag: ['a'], imgInDetail: '.product-img-box .image img', priceInDetail: ['.product-view-position .price-box'], titleDetail: '.product-name h1', descInDetail: '.description'};
          break;
        case 'tommy':
          alterArr = {title: ['.link']}
          break;
        case 'francescas':
          alterArr = {maxCheckLevel: 5, priceInDetail: ['.ml-product-item-detail .ml-product-pricing'],descInDetail:'#infoContentContainer'};
          break;
        case 'melissaanddoug':
          alterArr = {titleDetail: ['#pdpMain .pdp-main--product-name-cont h1'],desc:'.product-name a', descInDetail: '.pdp-extras--tab.tab-content-details', priceInDetail: ['#product-content .pdp-main--pricing']};
          break;
        case 'petsmart':
          alterArr = {arrList:['.product-image img'],'titleDetail':'h1.product-name', isCanvas: '.s7swatches .s7thumbcell .s7thumb[state=\'selected\']', imgInDetail: '.s7zoomview', descInDetail: '.tab-content'};
          break;
        case 'royalalbert':
          alterArr = {imgInDetail:['.product-image img'], descInDetail: '.product-detail .product-description'};
          break;
        case 'wedgwood':
          alterArr = {imgInDetail:['.product-image img'], descInDetail: '.product-detail .product-description', ignorePriceString: ['Stock Coming Soon']};
          break;
        case 'waterford':
          alterArr = {imgInDetail:['.product-image img'], descInDetail: '.product-detail .product-description', ignorePriceString:['Stock Coming Soon']};
          break;
        case 'gbyguess':
        case 'guessfactory':
          alterArr = {title: ['.name.label-plp a', '.description.label-plp'], imgInDetail: '.swiper-slide.swiper-slide-active > img', beforeText: ['.recsProducts .priceVal.sale']};
          break;
        case 'build':
          alterArr = {descInDetail: '#overview.active .description', desc: '.desc', titleDetail: '#heading', title: ['span.title'], imgInDetail: ['.owl-item.js-gallery-image img[style="display: block;"]','.owl-item.js-gallery-image img[data-iterator="0"]' ]}
          break;
        case 'royaldoulton':
          alterArr = {imgInDetail:['.product-image img'], descInDetail: '.product-detail .product-description', ignorePriceString:['Stock Coming Soon']};
          break;
        case 'jollychic':
          alterArr = {maxCheckLevel: 2, arrList:['.pro_list_imgbox a img','dt a img'], priceInList: ['.pro_list_price'], imgInDetail: ['.goods-img .goods-bigImg-item:not(.fn-hide)>img'], titleDetail: '.goods-info .goods-tlt', descInDetail: '.goods-info .goods-board .board-cnt', priceInDetail: ['.goods-info']};
          break;
        case 'topps':
          alterArr = {arrList: ['.product-image img'],desc: '.product-name a',imgInDetail:['#main-image.product-image img'], descInDetail: '.product-collateral','titleDetail': '.product-name h1:first'};
          break;
        case 'joefresh':
          alterArr = {descInDetail: '#main-content #detail-modal .modal-body', titleDetail: '.essential-info h1'};
          break;
        case 'sunjack':
          alterArr = {imgInDetail: '#ProductPhotoImg', descInDetail: '.product-description.rte'}
          break;
        case 'livingproof':
          alterArr = {title: ['.product-name'], desc: '.product-name a', imgInDetail: ['.product-image > img'], titleDetail: 'title', descInDetail: '.tab-content:first'}
          break;
        case 'rawspicebar':
          alterArr = {title: ['.woocommerce-LoopProduct-link > h3'], ignoreTag: ['a']}
          break;
        case 'rockler':
          alterArr = {title: ['.product-name.title > a'], desc: '.product-name > a', removeCommas: ['span.price'], imgInDetail: ['#wrap > a > img'], titleDetail: '#product-title-container h1', removeHTML: ['.mousetrap'], descInDetail: '.product-info-content'}
          break;
        case 'keepsakequilting':
          alterArr = {desc: '.product-name a', imgInDetail: ['#image-main'], descInDetail: '.desc-wrapper', titleDetail: '.product-name span.h1'}
          break;
        case 'pandahall':
          alterArr = {removeHTML: ['.mousetrap'],'title':['.AlsoProName a','p.TextName','p.ProName'],'descInDetail':'.Description_Inf,.Description',titleDetail: 'h1.ProductName,.DetailedTextBox strong:first,.DetailInf h3',arrList: ['.showProDetailed a img','.ProImg a img','.AlsoLike a img'],joinTitle: ['.showProRit dl dt a','.showProRit dl dt span'],'imgInDetail': '#zoom1 img,.swiper-wrapper img:first,.ImgDetailedBox img:first'};
          break;
        case 'giftedliving':
          alterArr = {desc: '.product-name a', imgInDetail:['.product-view .product-image img'], descInDetail: '.short-description'};
          break;
        case 'macofalltrades':
          alterArr = { arrList: ['.v-product a img'],imgInDetail: ['#product_photo_zoom_url img'], titleDetail: ['.colors_productname span'], descInDetail: '#ProductDetail_ProductDetails_div', removeCommas: ['div.product_productprice b', 'div.product_saleprice span', 'div.product_productprice']};
          break;
        case 'wigsbuy':
          alterArr = { arrList: ['#giftProduct li a img', 'a img'],imgInDetail: ['.lagerimg a:first img'], descInDetail: '.desdiv', titleDetail:".pro-title h1"};
          break;
        case 'tidebuy':
          alterArr = {ignorePriceString: ['Under'],imgInDetail: ['.lagerimg img'], extPriceInDetail: '#infoprice', descInDetail: '.Description', titleDetail: ['.gallery-right h1'], removeHTML: ['.titleInventory']};
          break;
        case 'kicksusa':
          alterArr = { priceInDetail: ['form#product_addtocart_form .special-price'],removeHTML: ['li .item .hover', '#mobile-freeshiping'], maxCheckLevelDetail: 11,imgInDetail:['.owl-item .item:first .product-image img'],'priceInList': ['.regular-price'],descInDetail: ['.description-section'/*,'#product-media h1'*/], titleDetail: ['h1.pro-name','#product-media h1'], ignorePriceString: ['SEE CART FOR PRICE']};
          break;
        case 'rosegal':
          alterArr = {imgInDetail: ['.goods_imgshow_bigshow a>img'], descInDetail: '.detail_editable','titleDetail': '.goods_infoshow h1'};
          break;
        case 'surefit':
          alterArr = {removeHTML: ['#tiSaleWrapper .tiSale'],removeFromChild: {'parent': '.ti-item-price', 'child': '.tiDetails:gt(0)'}, title: ['.ti-product-name','.fn.n.url'], imgInDetail: ['.slide.active a img'], titleDetail: ['.product-name h1'], descInDetail: '#tabDescription.product-active-tab'}
          break;
        case 'createandcraft':
          alterArr = {maxCheckLevelDetail: 10,removeHTML: ['.product-overlay', '#product-carousel-popup'],imgInDetail: ['.mainimage', '.owl-item.active .product-image img'],titleDetail: ['#ctl00_cphMain_ProductCache_ProductHeader_ProductTitleSpan','h1.product-header'],priceInDetail: ['#ctl00_cphMain_ProductCache_Pricing_pnlPricing','.pricing'],'arrList': ['.image-container a img'],descInDetail: '.tab-content.tab-content-selected, #tabFullDescription,#tabDescription'}
          break;
        case 'groopdealz':
          alterArr = {specialPrice: '.text p.price', title: ['.product-info .title'], titleDetail: ['.product-desktop-title-container h4'], descInDetail: '.product-description .desc'}
          break;
        case 'premierdeadsea-usa':
          alterArr = {maxCheckLevel: 2, title: ['.more_info .name a'], imgInDetail: ['#image'] ,descInDetail: 'span[itemprop="description"]'}
          break;
        case 'scarletandjulia':
          alterArr = {desc: '.product-desc .product-info h3.product-name a', titleDetail: ['.product-name span.h1'], descInDetail: '.tab-container.current .tab-content'}
          break;
        case 'bpisports':
          alterArr = {title: ['h4:first'], descInDetail:'.prodAccordionContent .Content', removeTagHTMLAlter: ['.VariationProductPrice sup'], wrapContent: ['.BlockContent li .ProductDetails em']};
          break;
        case 'kaplanmd':
          alterArr = {title: ['.product-name a']}
          break;
        case 'halloweencostumes':
          alterArr = {priceInDetail: ['#lblPurchasePrice'], removeTagHTML: ['.dollars', '.decimal', '.cents'], descInDetail: 'div[itemprop="description"]'}
          break;
        case 'jusbyjulie':
          alterArr = { desc: '.product-name a',imgInDetail:['#image']};
          break;
        case 'versaspa':
          alterArr = {title: ['.inner_product_header > h3'], titleDetail: ['h1[itemprop="name"]'], imgInDetail: ['.woocommerce-main-image img'], descInDetail: 'div[itemprop="description"]'}
          break;
        case 'menswearhouse':
          alterArr = {priceInDetail: ['.reg-price'], removeHTML: ['.slick-slider li:nth-child(1)'], descInDetail: '#details', desc: '.recommended-thumbnail-title, .prod-info .product-name', title: ['.recommended-thumbnail-title', '.prod-info .product-name']}
          break;
        case 'beckettsimonon':
          alterArr = {specialPrice: '.grid-link__meta', descInDetail: '.row.row-expanded:first', titleDetail: ['.sm.prod-title']}
          break;
        case 'refrigiwear':
          alterArr = { desc: '.ro-product-link .ro-product-title', imgInDetail: '.rw-product-main-image .ro-product-image', descInDetail: '.ro-product-description'};
          break;
        case 'anytimecostumes':
          alterArr = { desc: '.product-summary__name a', descInDetail: '.product-description__content-panel' /*imgInDetail: '.rw-product-main-image .ro-product-image', descInDetail: '.ro-product-description'*/};
          break;
        case 'citychiconline':
          alterArr = {desc: '.product-name a', imgInDetail: ['.product-img-box .product-image img'],descInDetail: '#description-content', offZoomPlugin: true, removeDetailAttr: [{selector: '#main-image', attr:['style']}]}
          break;
        case 'hannaandersson':
          alterArr = {ignoreTag:['a'], imgInDetail: '#primary-view',descInDetail: '#product-details','title':['a p:first','.itemname a']}
          break;
        case 'moltonbrown':
        alterArr = {ignorePriceString: ['Out of Stock'], descInDetail: '.productDetailTabs,#blend','desc': '.atg_store_productTitle h2,p a','titleDetail': '.productDetail h2','priceInDetail': ['.price'],wrapContent: ['#IO_PP_BB li'],'title':['#prodDPrwd','.atg_store_productTitle h2','h2','h4','p a']}
          break;
        case 'zooshoo':
          alterArr = {imgInDetail: '#main-product-detail .MagicToolboxContainer a figure>img',priceInDetail: ['.detail h2.price span'], offZoomPlugin: true}
          break;
        case 'na-kd':
          alterArr = {maxCheckLevel: 8,arrList: ['.common-carousels-olle-item img', '.image-container img','.nakd-grid-item img'],title: ['.contentTypes-common-title span'], descInDetail: '.readMore-paragraph > div','descInDetail':'.contentTypes-common-description-text,.tabContent',imgInDetail: ' .productImageGrid-grid-chosenImage .productImageGrid-display img,.nakd-singleProduct-content .singleProduct-pictures .common-carousels-olle-view img:first'};
          break;
        case 'petplus':
          alterArr = {maxCheckLevel: 4, title: ['a h4'], imgInDetail: '.product-image img:first', descInDetail: 'div[itemprop="description"]', titleDetail: ['h2.text-white']};
          break;
        case 'zaful':
          alterArr = {descInDetail: '.product_description'};
          break;
        case 'iolo':
          alterArr = {'desc': '.prods_middle > p:not(.featprod)','imgInDetail': ['img[alt="smb-product"]','.post .entry div img:first','#contentRight img','#mainContent img'],'titleDetail': '.smPageTitle','descInDetail': '#overviewSection','arrList': ['.prods_left a img']};
          break;
        case 'golfetail':
           alterArr = { /*beforeText: ['.igo_product_regular_price_value'],*/desc: '.nxt-product-name a',descInDetail: '.tabs-contents','arrList': ['.igo_product a img','.nxt-product-item a img'],'beforeText': ['.igo_product_regular_price_value']};
          break;
        case 'joann':
          alterArr = { titleDetail: '.product-detail h1.product-name' ,priceInDetail: ['.product-price'], descInDetail: '.product-description', imgInDetail: '.primary-image' };
          break;
        case 'bonton':
          alterArr = { imgInDetail: '.productPhotoContainer  .s7zoomview > div > div:nth-child(2)',isCanvas: '.s7swatches .s7thumbcell .s7thumb[state=\'selected\']',acceptHidden: true,'removeHTML': ['.productPhotoContainer .s7container img'],descInDetail: '.widget-content-desc','title': ['.productName ']};
          break;
        case 'amusesociety':
          alterArr = { titleDetail: 'h1.product-title', descInDetail: '.product-details.active-tab'};
          break;
        case 'perfume':
          alterArr = {imgInDetail: '#ProductImageSection > img', maxCheckLevelDetail: 10, titleDetail: ['div.product-hero-scale > h1'], descInDetail: '.product-hero-scale .mtn', priceInDetail: ['.price-info:first']}
          break;
        case 'artisticlabels':
          alterArr = {maxCheckLevel: 4, imgInDetail: '#thumb_image_div.pdp_DetailImage img', descInDetail: '.ProdDesc_content p'}
          break;
        case 'budgetpetcare':
          alterArr = {titleDetail: '#divOverview>h2', descInDetail: '#divOverview>p', removeHTML: ['#tab1>div:not(:first)'], arrList: ['.Popular_Product_Image a img'], 'imgInDetail': '#divOverview img'}
          break;
        case 'beautyencounter':
          alterArr = {maxCheckLevel: 6, desc: '.product-item-link, .product-name a, .product-item-abstract', descInDetail: '#product.info.description', removeDetailAttr: [{selector: '.fotorama__stage__frame.fotorama__active',attr: ['href', 'class'] }], unwrapHTML: [".fotorama__stage__shaft"]}
          break;
        case 'bostonstore':
          alterArr = {title: ['.productName'],imgInDetail: '.productPhotoContainer .s7zoomview > div > div:nth-child(2)',descInDetail:'.widget-content-desc','removeHTML': ['#jumboViewLink'],isCanvas: '.s7swatches .s7thumbcell .s7thumb[state=\'selected\']', acceptHidden: true};
          break;
        case 'blissworld':
          alterArr = {titleDetail: '.commerce-product-title', imgInDetail: ['.pdp-img-box .product-noslider .slick-slide-list img', '.pdp-img-box .product-slider .slick-slide-list:first img']};
          break;
        case 'booking':
          alterArr = {'maxCheckLevelDetail':9,'descInDetail': '.ipad_hotel_desc,#htInfo div.hp-hotel_details div.hotel_details__desc.block-link.js-toggle-class div.hotel_details__shorttext','priceInDetail': ['div.roomInfo.priceInfo','span.price.deal-price','#hotel-photos div.swpg__mask.swpg__last_item_cta p[data-case]'],wrapContent:['#hotel-photos.swpg__last_item_cta p[data-case]'],'desc': '.title_fix  a.hotel_name_link','imgBackground': 'a.hotel_name_link,.sr_simple_card_hotel_image,.recent-hotels-landing span.sr-viewed-photo','imgInDetail': ['img.hp-thumb:first','.swpg__photolist li:not(.swpg__item--secondary) img.swpg__image:first'],/*'removeHTML':['.add-red-tag','.discount_wrapper','.swpg__navbtns','#hotel-photos div.swpg__mask.swpg__last_item_cta p[data-case] br','#hotel-photos div.swpg__mask.swpg__last_item_cta p[data-case] a'],*/'removeHTMLAlter': ['.title_fix a img'],'anotherImgSrc': 'data-src','removeDetailAttr': [{selector: 'img.hp-thumb:first', attr:['src']}],'unwrapHTML': ['img.hp-thumb:first','img.hp-thumb:first']};
          break;
        case 'puma':
          alterArr = {onClick: ['ul.swatch-list:first-child>li:first-child>a:first-child img'],'desc': 'a.name-link','descInDetail': '#product-details'};
          break;
        case 'thebouqs':
          alterArr = {maxCheckLevel:5,setLinkForImg: [{from:'.product-image-mobile a', to:'.product-pod .LazyLoad  img', checkLevel: 3}],'title': ['.ProximaMedium'],'extPriceInDetail': '.right-column .margin-top-2x p span:nth-child(2):first','imgInDetail': 'div.visible-xs .image-gallery-slide.center img,.pdp-image-slider:first .hidden-xs .center img[data-reactid]:first','maxCheckLevelDetail':9,'removeAttr': [{selector: '#productlist .product-image .LazyLoad img', attr:['alt']}],'arrList': ['#productlist .product-pod .product-image img','.product-pod .LazyLoad  img'],onClick: ['a.image-gallery-thumbnail img:first'],'listContainer': 'product-pod','desc': '.description p','descInDetail':'.pdp-description'};
          break;
        case 'oneill':
          alterArr = {title: ['p > a']}
          break;
        case 'beckett':
          alterArr = {arrList: ['.image img'], setLinkForImg: [{from:'.description li.title a', to:'.image img', checkLevel: 2}], desc: '.title a', priceInList: ['.item-price'], imgInDetail: '#item_image_front', descInDetail: '#short_dd_set'}
          break;
        case 'artnaturals':
          alterArr = {arrList: ['.relative.product_image > img.primary'], removeClass: ['.sale_banner'], imgInDetail: ['.flex-active-slide a img.featured_image'], priceInDetail: ['span[itemprop="price"] > .current_price', 'span[itemprop="price"]'], descInDetail: '.description.active p', titleDetail: ['h1.product_name'] }
          break;
        case 'dynamiteclothing':
          alterArr = {title: ['.prodName a.none'], imgInDetail: ['#pdpImageDisplayContainer > img.pdpMainImg'], titleDetail: ['#prodDetailInfoHeader h1.prodName.prodNamePDP'], descInDetail: '.productDescriptionContent div[style=""]'}
          break;
        case 'reeds':
          alterArr = {imgInDetail: ['.productDetailImage.productImage[tabindex="0"] img'],'maxCheckLevelDetail': 8,'descInDetail': '.productDescription > span[itemprop="description"],.briefSummary .ktruncate','removeHTML': ['.rfk_condition'],'titleDetail': '.productOverview>[itemprop="name"]'};
          break;
        case 'currentlabels':
          alterArr = {'maxCheckLevel': 4,'arrList': ['.pdp_DetailImage a img','.productImg .productImg-wrap img'],'imgInDetail': '#thumb_image_div img','titleDetail':'.pdp_Title','descInDetail': '.ProdDesc_content p:nth-child(2),.product-details,.ProdDesc_content p'};
          break;
        case 'fairyseason':
          alterArr = {'arrList': ['#dirProList li a img','#proRightRecommend li a img','#history-list img','#productlist img','td img','#hotTop li a img'],'imgInDetail': '.t2 img','title':['.productInfo a:first','.hot-product-info'],'descInDetail': '#describe li span,#describe i'};
          break;
        case 'foodstirs':
          alterArr = {imgInDetail: '.product_gallery ul.slides li', setTargetImgDetail: '.slides li:first a img', ignorePriceString: ['Out of Stock'], descInDetail: '.description', priceInList: ['.info'] };
          break;
        case 'easyspirit':
          alterArr = {descInDetail: '#descContentDesc'}
          break;
        case 'hotter':
          alterArr = {descInDetail: '#tab1_content', imgInDetail: '#productMainImage'}
          break;
        case 'parrot':
          alterArr = {setLinkForImg: [{from:'.node_content_details h2 a', to:'.node_content_visual img', checkLevel: 3}],'imgInDetail': ['.product-content-visuals img:first'],'title':['.commerce-product-title'],'descInDetail': '.field-name-body','arrList': ['.view-content img[typeof="foaf:Image"]','.teaser_catalog img','#search-results .node_content_visual a img'],'specialUrl': '.node_content_details a,.product-states a','title': ['.node_content_details h2 a'],'desc': '.content h3 span,.node_content_details h2 a,.field-name-body ','removeHTML': ['.video-link-container']};
          break;
        case 'silkyscents':
          alterArr = {acceptImgHidden: true};
          break;
        case 'vissla':
          alterArr = {'titleDetail': 'h1[itemscope="name"]','descInDetail':'.details'};
          break;
        case 'champssports':
          alterArr = {imgInDetail: ['#product_images > #selected_item .selected img.reg_image'],priceInDetail: ['.product_price .sale'],'desc':'.product_title',descInDetail: '.description span[itemprop="description"]',titleDetail: ['h1.product_title'], title: ['span.product_title']  }
          break;
        default:
      }
      TFR.wrapper = $.extend(TFR.wrapper, alterArr);
    },
    adjustUrl: function(href){
      if(href.indexOf('http://recs.richrelevance.com/') > -1 || href.indexOf('http://www.recs.richrelevance.com/') > -1){
        return decodeURIComponent(href.replace(/.*&ct=(.*)$/,"$1")).trim();
      }
      return href;
    },
    start: function(){
      var time = 0;
      TFR.exportPriceInput();
      TFR.formatText();
      TFR.offPlugin();
      TFR.changeHTML();
      TFR.removeHTML();
      TFR.removeClass();
      TFR.commonStockIt();
      console.log('start');
      var timeIn = setInterval(function() {
        TFR.commonStockIt();
        TFR.removeHTMLAlter();
        if(time === 10)  {// Stop after 30 seconds
          clearInterval(timeIn);
        }
        time++;
      },3000);
        // Auto bind to add stockIt button.
       MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver(function(mutations, observer) {
          if(TFR.options.detailLink){
            var href = location.href;
            href = (href.indexOf('#') > -1) ? href.substr(0, href.indexOf('#')) : href;
            if( TFR.adjustUrl(encodeURI(decodeURI(href))) != TFR.options.detailLink){
              location.reload(true);
            }
          }
          var timeO = setTimeout(function() {
            TFR.commonStockIt();
            clearTimeout(timeO);
          }, 1000);
        });
        // define what element should be observed by the observer
        // and what types of mutations trigger the callback.
        observer.observe(document.body, {
        subtree: true,
        childList: true
        });
    },
    init: function(opts) {
      var options = {
        'mid': -1,
        'product': {'urls': [], 'btns': []},
        'maxCheckProdURLs': 5,
        'imgMinWidth': 120,
        'imgMinHeight': 120,
        'imgDetailWidth': 349,
        'imgDetailHeight': 349

      };
      this.wrapper = {
        'arrList': ['a img'],
        'imgInDetail': null,
        'maxCheckLevel': 3,
        'maxCheckLevelDetail': 7
      };
      this.options = $.extend({}, options, opts);
      this.services.baseUrl = this.getBaseURL();
      this.location = this.getProviderLocation();
      this.key = this.getDomainKey();

      this.alterWrapper();


      var cssFile = this.services.baseUrl + this.services.cssFile + '?r=v0.1',
      jsCjListFile = this.services.baseUrl + this.services.cjListFile + '?r=v0.2',
      jsmidListFile = this.services.baseUrl + this.services.midListFile + '?r=v0.1',
      jsfoListFile = this.services.baseUrl + this.services.foListFile + '?r=v0.1';
      if(TFR.wrapper.loadScripts && TFR.wrapper.loadScripts.length) {
        TFR.wrapper.loadScripts.forEach(function(script) {
          loadScript(script);
        })
      }
      $('<style type="text/css">@import url("' + cssFile + '");</style>').appendTo("head");
      loadScript(jsCjListFile); // Load cjLists.
      loadScript(jsfoListFile); // Load foLists.
      loadScript(jsmidListFile,function(){
        TFR.options.mid = TFR.getMID();
        if(TFR.options.mid == -1 || TFR.options.mid == -2){
          // Check current has MID or not.
            var timeIn = setInterval(function() {
              TFR.options.mid = TFR.getMID();
              if (TFR.options.mid == -1 || TFR.options.mid == -2) {
                if (TFR.options.mid == -2) {
                  console.log('Empty MID');
                  }
                return true;
              }
              clearInterval(timeIn);
              TFR.start();
            },1000);
        }else{
          TFR.start();
        }
      }); // Load MIDLists.
    },
    services: {
      'baseUrl': '', // Will be updated in init function.
      'checkStatus': '/products/checkstatus',
      'stockIt' : '/stores/stockproduct',
      'midListFile': 'transformer/MIDLists.js',
      'cjListFile': 'transformer/cjLists.js',
      'foListFile': 'transformer/foLists.js',
      'cssFile': 'transformer/stockIt.css?v=' + Math.floor(Math.random()*999)
    },
    options: {},
    total:0,
    ignoreReady: [
      //'bloomingdales',
      'brandsmartusa',
      'golfetail',
      'ahava',
      'createandcraft',
      'budgetpetcare'
    ],
    checkIgnoreReady: function () {
      var boolean = false;
      if (this.ignoreReady && this.ignoreReady.length) {
        this.location = this.getProviderLocation();
        var key = this.getDomainKey();
        this.ignoreReady.forEach(function (name) {
          if (name == key) {
            boolean = true;
          }
        })
      }
      return boolean;
    }
  };

  // Load jQuery library and execute TFR script.
  if (typeof(jQuery) === 'undefined' || (typeof(jQuery.fn) !== 'undefined' && versioncompare(jQuery.fn.jquery.replace(/\.(\d)/g,".0$1").replace(/\.0(\d{2})/g,".$1"),'1.6.0') == -1) ) {
      if(typeof(jQuery) != 'undefined') $ = jQuery.noConflict();
      var baseURL = document.currentScript.src;
      loadScript('https://code.jquery.com/jquery-1.11.3.min.js', function(){
        (function($){
          $(document).ready(function () {
            // $( window ).load(function() {
            window.startStock = true;
            TFR.init();
          });
          setTimeout(function () {
            if (TFR.checkIgnoreReady() && !window.startStock) {
              window.startStock = true;
              TFR.init();
            }
          }, 5000)
        })(jQuery);
      });
  } else {
    if(typeof $ == 'undefined' || typeof $.fn == 'undefined') {
      $ = jQuery.noConflict();
    } else {
      $ = $.noConflict();
    }
    var script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js";
    document.body.appendChild(script);
    var FastClick = FastClick;
    $(document).ready(function () {
      // $( window ).load(function() {
      window.startStock = true;
      TFR.init();
    });
    setTimeout(function () {
      if(typeof FastClick !== 'undefined') {
        FastClick.attach(document.body);
      }
      if (TFR.checkIgnoreReady() && !window.startStock) {
        window.startStock = true;
        TFR.init();
      }
    }, 5000)
  }
}else{
  if(TFR.options.mid != -1 && TFR.options.mid != -2){
    TFR.commonStockIt();
  }
}
