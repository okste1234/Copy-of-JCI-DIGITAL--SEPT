window.theme = window.theme || {};

/* ================ SLATE ================ */
window.theme = window.theme || {};

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = (instance.id === evt.detail.sectionId);

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(function(index, container) {
      this._createInstance(container, constructor);
    }.bind(this));
  }
});

window.slate = window.slate || {};

/**
 * iFrames
 * -----------------------------------------------------------------------------
 * Wrap videos in div to force responsive layout.
 *
 * @namespace iframes
 */

slate.rte = {
  wrapTable: function() {
    $('.rte table').wrap('<div class="rte__table-wrapper"></div>');
  },

  iframeReset: function() {
    var $iframeVideo = $('.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]');
    var $iframeReset = $iframeVideo.add('.rte iframe#admin_bar_iframe');

    $iframeVideo.each(function() {
      // Add wrapper to make video responsive
      $(this).wrap('<div class="video-wrapper"></div>');
    });

    $iframeReset.each(function() {
      // Re-set the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      // Need to specifically target video and admin bar
      this.src = this.src;
    });
  }
};

window.slate = window.slate || {};

/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 *
 *
 * @namespace a11y
 */

slate.a11y = {

  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element.first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element.first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on('click', function(evt) {
      this.pageLinkFocus($(evt.currentTarget.hash));
    }.bind(this));
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).off('focusin');

    $(document).on(eventName, function(evt) {
      if (options.$container[0] !== evt.target && !options.$container.has(evt.target).length) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  }
};

/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function() {

  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element); // eslint-disable-line callback-return
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * +++ Useful
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    /*var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);

    if (match !== null) {
      return match[1];
    } else {
      return null;
    }*/
  }

  /**
   * +++ Useful
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size == null) {
      return src;
    }

    if (size === 'master') {
      return this.removeProtocol(src);
    }

    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

    if (match != null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + '_' + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  };
})();

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function() {
  var moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || moneyFormat);

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = precision || 2;
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsAmount = parts[1] ? (decimal + parts[1]) : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  }
})();

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

slate.Variants = (function() {

  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
  }

  Variants.prototype = _.assignIn({}, Variants.prototype, {

    /**
     * Get the currently selected options from add-to-cart form. Works with all
     * form input elements.
     *
     * @return {array} options - Values of currently selected variants
     */
    _getCurrentOptions: function() {
      var currentOptions = _.map($(this.singleOptionSelector, this.$container), function(element) {
        var $element = $(element);
        var type = $element.attr('type');
        var currentOption = {};

        if (type === 'radio' || type === 'checkbox') {
          if ($element[0].checked) {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          } else {
            return false;
          }
        } else {
          currentOption.value = $element.val();
          currentOption.index = $element.data('index');

          return currentOption;
        }
      });

      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = _.compact(currentOptions);

      return currentOptions;
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selectedValues - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function() {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;

      var found = _.find(variants, function(variant) {
        return selectedValues.every(function(values) {
          return _.isEqual(variant[values.index], values.value);
        });
      });

      return found;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onSelectChange: function() {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: 'variantChange',
        variant: variant
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    /**
     * Trigger event when variant image changes
     *
     * @param  {object} variant - Currently selected variant
     * @return {event}  variantImageChange
     */
    _updateImages: function(variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
        return;
      }

      this.$container.trigger({
        type: 'variantImageChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function(variant) {
      if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
        return;
      }

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant sku changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantSKUChange
     */
    _updateSKU: function(variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this.$container.trigger({
        type: 'variantSKUChange',
        variant: variant
      });
    },

    /**
     * Update history state for product deeplinking
     *
     * @param  {variant} variant - Currently selected variant
     * @return {k}         [description]
     */
    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
      window.history.replaceState({path: newurl}, '', newurl);
    },

    /**
     * Update hidden master select of variant change
     *
     * @param  {variant} variant - Currently selected variant
     */
    _updateMasterSelect: function(variant) {
      $(this.originalSelectorId, this.$container).val(variant.id);
    }
  });

  return Variants;
})();



/*================ SECTIONS ================*/

/* eslint-disable no-new */
theme.Product = (function() {
  function Product(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');

    this.settings = {
      // Breakpoints from src/stylesheets/global/variables.scss.liquid
      mediaQueryMediumUp: 'screen and (min-width: 750px)',
      mediaQuerySmall: 'screen and (max-width: 749px)',
      bpSmall: false,
      enableHistoryState: $container.data('enable-history-state') || false,
      imageSize: null,
      imageZoomSize: null,
      namespace: '.slideshow-' + sectionId,
      sectionId: sectionId,
      sliderActive: false,
      zoomEnabled: false
    };

    this.selectors = {
      addToCart: '#AddToCart-' + sectionId,
      addToCartText: '#AddToCartText-' + sectionId,
      comparePrice: '#ComparePrice-' + sectionId,
      originalPrice: '#ProductPrice-' + sectionId,
      SKU: '.variant-sku',
      originalPriceWrapper: '.product-price__price-' + sectionId,
      originalSelectorId: '#ProductSelect-' + sectionId,
      productFeaturedImage: '#FeaturedImage-' + sectionId,
      productImageWrap: '#FeaturedImageZoom-' + sectionId,
      productPrices: '.product-single__price-' + sectionId,
      productThumbImages: '.product-single__thumbnail--' + sectionId,
      productThumbs: '.product-single__thumbnails-' + sectionId,
      saleClasses: 'product-price__sale product-price__sale--single',
      saleLabel: '.product-price__sale-label-' + sectionId,
      singleOptionSelector: '.single-option-selector-' + sectionId
    }
	
    $(".product-photoslider").not('.slick-initialized').slick({
      dots: false,
      infinite: true,
      speed: 300,
      rtl: theme.rtl,
      slidesToShow: 1,
      slidesToScroll: 1
    });
    
    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$('#ProductJson-' + sectionId).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(document.getElementById('ProductJson-' + sectionId).innerHTML);

    this.settings.zoomEnabled = $(this.selectors.productFeaturedImage).hasClass('js-zoom-enabled');
    this.settings.imageSize = theme.Images.imageSize($(this.selectors.productFeaturedImage).attr('src'));

    if (this.settings.zoomEnabled) {
      this.settings.imageZoomSize = theme.Images.imageSize($(this.selectors.productImageWrap).data('zoom'));
    }

    this._stringOverrides();
    this._initVariants();

    // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
    // when a variant is selected that has a variant image
    theme.Images.preload(this.productSingleObject.images, this.settings.imageSize);
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    _stringOverrides: function() {
      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    _initVariants: function() {
      
      var options = {
        $container: this.$container,
        enableHistoryState: this.$container.data('enable-history-state') || false,
        singleOptionSelector: this.selectors.singleOptionSelector,
        originalSelectorId: this.selectors.originalSelectorId,
        product: this.productSingleObject
      };

      this.variants = new slate.Variants(options);

      this.$container.on('variantChange' + this.settings.namespace, this._updateAddToCart.bind(this));
      this.$container.on('variantImageChange' + this.settings.namespace, this._updateImages.bind(this));
      this.$container.on('variantPriceChange' + this.settings.namespace, this._updatePrice.bind(this));
      this.$container.on('variantSKUChange' + this.settings.namespace, this._updateSKU.bind(this));
    },
    
    _updateImages: function(evt) {
      var variant = evt.variant;
      var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);

      this._setActiveThumbnail(sizedImgUrl);
    },
    
    _setActiveThumbnail: function(src) {
      // Set active thumbnails (incl. slick cloned thumbs) with matching 'href'
      var $thumbnail = $('.product-photoslider .item[data-src="' + src + '"]'),
          slideno = $thumbnail.attr('data-slick-index');
      $('.product-photoslider').slick('slickGoTo', slideno);
    },

    _updateAddToCart: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(this.selectors.productPrices)
          .removeClass('visibility-hidden')
          .attr('aria-hidden', 'true');

        if (variant.available) {
          $(this.selectors.addToCart).prop('disabled', false);
          $(this.selectors.addToCartText).text(theme.strings.addToCart);
          $(".instock").removeClass("hide");
          $(".outstock").addClass("hide");
        } else {
          // The variant doesn't exist, disable submit button and change the text.
          // This may be an error or notice that a specific variant is not available.
          $(this.selectors.addToCart).prop('disabled', true);
          $(this.selectors.addToCartText).text(theme.strings.soldOut);
          $(".instock").addClass("hide");
          $(".outstock").removeClass("hide");
        }
      } else {
        $(this.selectors.addToCart).prop('disabled', true);
        $(this.selectors.addToCartText).text(theme.strings.unavailable);
        $(this.selectors.productPrices).addClass('visibility-hidden').attr('aria-hidden', 'false');
        $(".instock").addClass("hide");
        $(".outstock").removeClass("hide");
      }
    },

    _updatePrice: function(evt) {
      var variant = evt.variant;

      // Update the product price
      $(this.selectors.originalPrice).html(theme.Currency.formatMoney(variant.price, theme.moneyFormat));

      // Update and show the product's compare price if necessary
      if (variant.compare_at_price > variant.price) {
        $(this.selectors.comparePrice)
          .html(theme.Currency.formatMoney(variant.compare_at_price, theme.moneyFormat))
          .removeClass('hide');

        $(this.selectors.originalPriceWrapper).addClass(this.selectors.saleClasses);

        $(this.selectors.saleLabel).removeClass('hide');
      } else {
        $(this.selectors.comparePrice).addClass('hide');
        $(this.selectors.saleLabel).addClass('hide');
        $(this.selectors.originalPriceWrapper).removeClass(this.selectors.saleClasses);
      }
    },

    _updateSKU: function(evt) {
      var variant = evt.variant;

      // Update the sku
      $(this.selectors.SKU).html(variant.sku);
    },

    onUnload: function() {
      this.$container.off(this.settings.namespace);
    }
  });


  return Product;
})();

theme.ajaxCart = function(){
  	drawerTimeout: null,
  	prodAddToCart();wishlist();updateWishlist();
	
	$(".continue-shopping, .modalOverly, .closeDrawer").click(function(){
        clearTimeout(drawerTimeout), $(".modal").fadeOut(200);
    	$("body").removeClass("loading showOverly");
    });

    function prodAddToCart(){
      $(".product-form__cart-submit").click(function(i) {
        if (i.preventDefault(), "disabled" != $(this).attr("disabled"))
          if (theme.ajax_cart) {
            var att = $(this).closest("form").find("select[name=id]").val();
            	att || (att = $(this).closest("form").find("input[name=id]").val());
            var qty = $(this).closest("form").find("input[name=quantity]").val();
            	qty || (qty = 1);
            addinToCart(att, qty);
          } else {
            $(".product-form").submit();
          }
        return;
      })
    }
    function addinToCart(att, qty){
      $("body").addClass("loading");
      CartJS.addItem(att, qty,{},
      {
          "success": function(data, textStatus, jqXHR){
             $("#successDrawer").find(".modal-prod-img").attr("src",'');
             var pimg = data.image,
             	 pimg_path = pimg.replace(/(\.[^\.]*$|$)/, '_small' + '$&');
			 $("#successDrawer").find(".modal-prod-img").attr("src", pimg_path);
             $("#successDrawer").find(".modal-prod-name").text(data.product_title);
             $("body").removeClass("loading showOverly");
             showDrawer("#successDrawer");
          },
          "error": function(jqXHR, textStatus, errorThrown){
            var errormsg = JSON.parse(jqXHR.responseText).description;
            $("body").removeClass("loading");
            $(".error-message").text(errormsg), showDrawer("#errorDrawer");
          }
      });
    }
  	function showDrawer(i){
      $("body").addClass("loading showOverly");
      $(i).fadeIn(500);
      drawerTimeout = setTimeout(function(){
          $("body").removeClass("loading showOverly"), $(i).fadeOut(200)
      }, 8000);
    }

  	function wishlist() {
       var cookieName = "wishlistList";
       $(".add-to-wishlist").click(function(e){
           e.preventDefault();
             var id = $(this).attr('rel');
             if($.cookie(cookieName) == null) {
               var str = id;
             } else {
               if($.cookie(cookieName).indexOf(id) == -1) {
                 var str = $.cookie(cookieName) + '__' + id;
               }
             }
             $.cookie(cookieName, str, {expires:30, path:'/'});
             $(this).next(".loading-wishlist").css('display','block');
             $(this).hide();
             setTimeout(function(){
               $('.add-to-wishlist[rel="'+id+'"]').next(".loading-wishlist").hide();
               $('.added-wishlist[rel="'+id+'"]').css('display','block');
             }, 2000);
         })
     }
     function updateWishlist() {
       var cookieName = "wishlistList";
       try {
         if($.cookie(cookieName) != null && $.cookie(cookieName) != '__' && $.cookie(cookieName) != '') {
           var str = String($.cookie(cookieName)).split("__");
           for (var i=0; i<str.length; i++) {
             if (str[i] != '') {
               $('.added-wishlist[rel="'+str[i]+'"]').css('display','block');
               $('.add-to-wishlist[rel="'+str[i]+'"]').hide();
             }
           }
         }
       }
       catch (err) {}
     }
};
$(theme.ajaxCart);

$(document).ready(function() {
  var sections = new theme.Sections();

  sections.register('product', theme.Product);
  
  $(".qtyBtn").on("click", function() {
      var qtyField = $(this).parent(".qtyField"),
         oldValue = $(qtyField).find(".qty").val(),
          newVal = 1;

      if ($(this).is(".plus")) {
        newVal = parseInt(oldValue) + 1;
      } else if (oldValue > 1) {
        newVal = parseInt(oldValue) - 1;
      }
      $(qtyField).find(".qty").val(newVal);
    });
  
});