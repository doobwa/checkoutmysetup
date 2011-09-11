/*
 * Royal Slider  v5.0
 *
 * Copyright 2011, Dmitry Semenov
 * 
 * August 2011
 */
(function($) {

	function RoyalSlider(element, options) {
			

		this.slider = $(element);
		var self = this;
		
		this.settings = $.extend({}, $.fn.royalSlider.defaults, options);

		if(this.hasTouch) {
			this.settings.directionNavAutoHide = false;
			this.settings.hideArrowOnLastSlide = true;
		}
		this.isSlideshowRunning = false;
		this._slideshowHoverLastState = false;

		this._dragContainer = this.slider.find(".royalSlidesContainer");
		this._slidesWrapper = this._dragContainer.wrap('<div class="royalWrapper"/>').parent();
		this.slides = this._dragContainer.find(".royalSlide");

		this._preloader = "<p class='royalPreloader'>Loading image...</p>";
		
		
		
		this._useWebkitTransition = false;
		if("ontouchstart" in window) {
			if(!this.settings.disableTranslate3d) {				
				if(('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix())) {	
					this._dragContainer.css({"-webkit-transform-origin":"0 0", "-webkit-transform": "translateZ(0)"});
					this._useWebkitTransition = true;
				}
			}			
			this.hasTouch = true;
			this._downEvent = "touchstart";
			this._moveEvent = "touchmove.rs";
			this._upEvent = "touchend.rs";
		} else {
			this.hasTouch = false;
			this._downEvent = "mousedown";
			this._moveEvent = "mousemove.rs";
			this._upEvent = "mouseup.rs";
		}	
		

		this.slidesArr = [];
		var	slideObj,
			jqSlide,
			dataSRC,
			slideImg;

		// parse slides
		this.slides.each(function() {			
			jqSlide = $(this);			

			slideObj = {};
			slideObj.slide = jqSlide;

			dataSRC = jqSlide.attr("data-src");

			if(dataSRC == undefined || dataSRC == "" || dataSRC == "none") {
				slideObj.preload = false;				
			} else {
				slideObj.preload = true;						
				slideObj.preloadURL = dataSRC;
			}			

			if(self.settings.captionAnimationEnabled) {
				slideObj.caption =  jqSlide.find(".royalCaption").css("display", "none");	
			}

			self.slidesArr.push(slideObj);
		});


		this._removeFadeAnimation = false;	
		if(this.settings.removeCaptionsOpacityInIE8) {
			if ($.browser.msie  && parseInt($.browser.version, 10) <= 8) {
				this._removeFadeAnimation = true;	
			}
		}


		this.slider.css("overflow","visible");

		this.sliderWidth = 0;
		this.sliderHeight = 0;


		this.slideshowTimer = '';

		this.numSlides = this.slides.length;

		this.currentSlideId = 0;
		this.lastSlideId = -1;

		this.isAnimating = true;
		
		this.wasSlideshowPlaying = false;
		
		// Used for checking back/forward drag direction
		this._currentDragPosition = 0;
		this._lastDragPosition = 0;	

		// Stores caption animations and clears after next slide is shown
		this._captionAnimateTimeouts = [];
		this._captionAnimateProperties = [];

		this._blockClickEvents = false;

		this._tx = 0;
		this._startMouseX = 0;
		//used for detecting horizonal or vertical drag move
		this._startMouseY = 0;
		this._startPos = 0;

		this._isDragging = false;

		
		

		this._isHovering = false;

		// Setup Slideshow
		if(this.settings.slideshowEnabled) {
			if(this.settings.slideshowDelay > 0) {	
				if(this.settings.slideshowPauseOnHover) {				
					this.slider.hover(
							function() {
								self._isHovering = true;							
								self.stopSlideshow(true);
							},
							function() {
								self._isHovering = false;							
								self.resumeSlideshow(true);
							}
					);				
				}
			}			
		}


		// Adding grab/grabbing cursors
		var cursCoords = ""; 

		if($.browser.msie) {
			if(parseInt($.browser.version, 10) == 7) {
				this.isIE7 = true;
				this._dragContainer.css("cursor","move");
			}
		} else {
			this.isIE7 = false;
		}
		if($.browser.opera) {
			_grabCursor = "move";
			_grabbingCursor = "move";
		} else {
			if($.browser.mozilla) {
				_grabCursor = "-moz-grab";
				_grabbingCursor =  "-moz-grabbing";
			} else {
				_grabCursor =  "url(img/cursors/grab.cur), move";
				_grabbingCursor =  "url(img/cursors/grabbing.cur), move";
			}
			_grabCursor = $.browser.mozilla ? "-moz-grab" : "url(img/cursors/grab.cur), move";
			_grabbingCursor = $.browser.mozilla ? "-moz-grabbing" : "url(img/cursors/grabbing.cur), move";
		}
		this._setGrabCursor();



		// Setup control nav (thumbs/bullets)
		if(this.settings.controlNavEnabled) {
			var _navigation;
			var _navigationContainer;

			if(!self.settings.controlNavThumbs) {				
				_navigationContainer = $('<div class="royalControlNavOverflow"><div class="royalControlNavContainer"><div class="royalControlNavCenterer"></div></div></div>');
				_navigation = _navigationContainer.find('.royalControlNavCenterer');		
			} else {
				if(self.settings.controlNavThumbsNavigation) {
					
					
					this.thumbsArrowLeft = $("<a href='#' class='thumbsArrow left disabled'></a>");
					this.thumbsArrowRight = $("<a href='#' class='thumbsArrow right'></a>");
					
					this._slidesWrapper.after(this.thumbsArrowLeft);
					this._slidesWrapper.after(this.thumbsArrowRight);
					
					// get size of thumbs scroller based on slider size and thumbs arrows size
					var thumbArrowLeftWidth = parseInt(this.thumbsArrowLeft.outerWidth(), 10);					
					_navigationContainer = $('<div class="royalControlNavOverflow royalThumbs" style="left:'+thumbArrowLeftWidth+'px; width:'+(this.slider.width() - thumbArrowLeftWidth - parseInt(this.thumbsArrowRight.outerWidth(),10)) + 'px;"><div class="royalControlNavThumbsContainer"></div></div>');

					_navigation = _navigationContainer.find('.royalControlNavThumbsContainer');	
				} else {
					_navigationContainer = $('<div class="royalControlNavOverflow royalThumbs"><div class="royalControlNavContainer"><div class="royalControlNavCenterer"></div></div></div>');
					_navigation = _navigationContainer.find(".royalControlNavCenterer");		
				}

			}

			var cSlideId = 0;
			this.slides.each(function(){	
				if(self.settings.controlNavThumbs) {								
					_navigation.append("<a href='#' class='royalThumb' style='background-image:url("+ $(this).attr("data-thumb") +");'/>");				
				} else {					
					_navigation.append('<a href="#"/>');	
				}	
				cSlideId++;	
			});		

			this.navItems = _navigation.children();
			this.navItems.eq(0).addClass("current");			

			this._slidesWrapper.after(_navigationContainer);

			// Thumbnails navigation
			if(self.settings.controlNavThumbs && self.settings.controlNavThumbsNavigation) {
				this._thumbsArrowLeftBlocked = true;
				this._thumbsArrowRightBlocked = false;

				this._thumbsNavContainer = _navigation;
				
				if(this._useWebkitTransition) {
					this._thumbsNavContainer.css({'-webkit-transition-duration': this.settings.controlNavThumbsSpeed + "ms",
						'-webkit-transition-property': '-webkit-transform',
						'-webkit-transition-timing-function': "ease-in-out"
					});
				}
				
				this._thumbsContainerWidth = parseInt(_navigationContainer.width(), 10);

				this._numThumbItems = cSlideId;
				var firstItem = this.navItems.eq(0);
				this._outerThumbWidth = firstItem.outerWidth(true);
				this._thumbsTotalWidth = this._outerThumbWidth * this._numThumbItems;

				this._thumbsNavContainer.css("width",this._thumbsTotalWidth);
				this._thumbsSpacing = parseInt(firstItem.css("marginRight"), 10);
				this._thumbsTotalWidth -= this._thumbsSpacing;			

				this._currThumbsX = 0;
				this._minThumbsX = -(this._thumbsTotalWidth - this._thumbsContainerWidth);

				if(this._thumbsContainerWidth >= this._thumbsTotalWidth) {
					this._thumbsArrowRightBlocked = true;
					this.thumbsArrowRight.addClass("disabled");
					this.settings.controlNavThumbsNavigation = false;
				}


				this.thumbsArrowLeft.click(function(e){
					e.preventDefault();
					if(!self._thumbsArrowLeftBlocked)
						self._animateThumbs(self._currThumbsX + self._thumbsContainerWidth + self._thumbsSpacing);					
				});
				this.thumbsArrowRight.click(function(e){
					e.preventDefault();
					if(!self._thumbsArrowRightBlocked)
						self._animateThumbs(self._currThumbsX - self._thumbsContainerWidth - self._thumbsSpacing);					
				});
			}
		}



		//Direction navigation (arrows)
		if(this.settings.directionNavEnabled) {	
			this._slidesWrapper.after("<a href='#' class='arrow left'/>");
			this._slidesWrapper.after("<a href='#' class='arrow right'/>");


			this.arrowLeft = this.slider.find("a.arrow.left");
			this.arrowRight = this.slider.find("a.arrow.right");

			if(this.arrowLeft.length < 1 || this.arrowRight.length < 1) {
				this.settings.directionNavEnabled = false;
			} else if(this.settings.directionNavAutoHide) {
				this.arrowLeft.hide();
				this.arrowRight.hide();

				this.slider.one("mousemove.arrowshover",function() {
					self.arrowLeft.fadeIn("fast");
					self.arrowRight.fadeIn("fast");					
				});


				this.slider.hover(
						function() {
							self.arrowLeft.fadeIn("fast");
							self.arrowRight.fadeIn("fast");
						},
						function() {
							self.arrowLeft.fadeOut("fast");
							self.arrowRight.fadeOut("fast");				
						}
				);	
			}	
			if(this.settings.hideArrowOnLastSlide) {
				this._arrowLeftBlocked = true;
				this._arrowRightBloacked = false;
				this.arrowLeft.addClass("disabled");
			}	
		}



		// Manage window resize event with 100ms delay
		this.slidesWrapperWidth = 0;
		this.slidesWrapperHeight = 0;
		var resizeTimer;
		$(window).bind('resize.rs', function() {		
			if (resizeTimer) 
				clearTimeout(resizeTimer);			
			resizeTimer = setTimeout(function() { self.updateSliderSize(); }, 100);			
		});
		this.updateSliderSize();

		this.settings.beforeLoadStart.call(this);

		// loading screen handling
		var firstSlide = this.slidesArr[0];		
		if(this.settings.welcomeScreenEnabled) {
			// gets url of image to preload (background-image of slide)
			function hideWelcomeScreen() {	

				self.settings.loadingComplete.call(self);
				// start preloading second image
				if(self.settings.preloadNearbyImages) {						
					self._preloadImage(self.slidesArr[1]);
				}				

				self.slider.find(".royalLoadingScreen").fadeOut(self.settings.welcomeScreenShowSpeed);	
				setTimeout(function(){ self._startSlider(); }, self.settings.welcomeScreenShowSpeed + 100);		
			}


			if(firstSlide.preload) {				
				// lazy-load image								
				this._preloadImage(firstSlide, function(){						
					hideWelcomeScreen();								
				});

			} else {				
				var slideImg = firstSlide.slide.find("img.royalImage")[0];


				if(slideImg) {	
					if(this._isImageLoaded(slideImg)) {
						hideWelcomeScreen();							
					} else {						
						// create new image and wait it to load (IE bug)
						$('<img />').load( function(){							
							hideWelcomeScreen();	
						}).attr('src', slideImg.src);						
					}
				}
				else {
					// no image tag, just start slider					
					hideWelcomeScreen();	
				}				
			}			
		} else {	
			if(firstSlide.preload) {				
				// lazy-load image								
				this._preloadImage(firstSlide, function(){		
					self.settings.loadingComplete.call(self);
					if(self.settings.preloadNearbyImages) {						
						self._preloadImage(self.slidesArr[1]);
					}					
				});
			} else {
				this.settings.loadingComplete.call(this);
			}
			setTimeout(function(){ self._startSlider(); },100);	
		}


	} /* RoyalSlider Constructor End
	/* -------------------------------------RoyalSlider Prototype------------------------------------------------------*/
	RoyalSlider.prototype = {
			// Move to slide with specified id
			goTo:function(id, fromNav) {	
				if(!this.isAnimating) {
					this.isAnimating = true;
					var self = this;

					this.lastSlideId = this.currentSlideId;
					this.currentSlideId = id;	

					this._dragContainer.unbind(this._downEvent);

					this._blockClickEvents = true;
					
					if(this.lastSlideId != id) {	
						
						if(this.settings.controlNavEnabled) {					
							this.navItems.eq(this.lastSlideId).removeClass('current');

							this.navItems.eq(id).addClass("current");

							// thumbnails scroller navigation
							if(this.settings.controlNavThumbs && this.settings.controlNavThumbsNavigation) {					
								var _thumbX = this.navItems.eq(id).position().left;					
								var _currThumbVisiblePosition = _thumbX - Math.abs(this._currThumbsX);							
								
								if(_currThumbVisiblePosition > this._thumbsContainerWidth - this._outerThumbWidth * 2 - 1 - this._thumbsSpacing) {
									if(!fromNav) {
										this._animateThumbs(-_thumbX + this._outerThumbWidth);
									} else {
										this._animateThumbs(-_thumbX - this._outerThumbWidth * 2 + this._thumbsContainerWidth + this._thumbsSpacing);
									}								
								} else if (_currThumbVisiblePosition < this._outerThumbWidth * 2 - 1) {								
									if(!fromNav) {
										this._animateThumbs(-_thumbX - this._outerThumbWidth * 2 + this._thumbsContainerWidth + this._thumbsSpacing);
									} else {
										this._animateThumbs(-_thumbX + this._outerThumbWidth);
									}								
								}
							}
						}
						
						if(this.settings.preloadNearbyImages) {
							var self = this;				
							this._preloadImage(this.slidesArr[id], function() {					
								self._preloadImage(self.slidesArr[id + 1], function() {
									self._preloadImage(self.slidesArr[id - 1]);	
								});	
							});
						} else {				
							this._preloadImage(this.slidesArr[id]);	
						}								
					}



					if(this.settings.directionNavEnabled)
					{
						if(this.settings.hideArrowOnLastSlide) {						
							if(this.currentSlideId == 0) {
								this._arrowLeftBlocked = true;
								this.arrowLeft.addClass("disabled");	
								if(this._arrowRightBlocked) {
									this._arrowRightBlocked = false;
									this.arrowRight.removeClass("disabled");
								}
							} else if(this.currentSlideId == this.numSlides - 1) {
								this._arrowRightBlocked = true;							
								this.arrowRight.addClass("disabled");	
								if(this._arrowLeftBlocked) {
									this._arrowLeftBlocked = false;
									this.arrowLeft.removeClass("disabled");		
								}
							} else {
								if(this._arrowLeftBlocked) {								
									this._arrowLeftBlocked = false;
									this.arrowLeft.removeClass("disabled");				
								} else if(this._arrowRightBlocked) {								
									this._arrowRightBlocked = false;
									this.arrowRight.removeClass("disabled");		
								}
							}
						}
					}


					this.settings.beforeSlideChange.call(this);

					this.stopSlideshow();

					// Animate slide
					if(!this._useWebkitTransition) {
						if(parseInt(this._dragContainer.css("left"), 10) !== -this.currentSlideId * this.sliderWidth){
							this._dragContainer.animate(
									{left: -this.currentSlideId * this.sliderWidth}, 
									this.settings.slideTransitionSpeed,
									this.settings.slideTransitionEasing, 
									function(){self._onSlideAnimationComplete();
							});
						} else {						
							this._onSlideAnimationComplete();
						}
 						
					} else {						
						if(this._getWebkitTransformX() !==  -this.currentSlideId * this.sliderWidth) {					
							
							
							this._dragContainer.bind("webkitTransitionEnd", function(e) {								
								if(e.target == self._dragContainer.get(0)) {									
									self._onSlideAnimationComplete();		
									self._dragContainer.unbind("webkitTransitionEnd");
								}								
							});
							
							this._dragContainer.css({
								'-webkit-transition-duration': this.settings.slideTransitionSpeed + "ms",
								'-webkit-transition-property': '-webkit-transform',
								'-webkit-transition-timing-function': "ease-in-out",
								'-webkit-transform': 'translate3d(' + -this.currentSlideId * this.sliderWidth + 'px, 0, 0)'								
							});								
						} else {						
							this._onSlideAnimationComplete();
						}						
					}
				}
			},	
			// go to prev slide (cyclic)
			prev:function() {
				if(this.currentSlideId <= 0) { 
					this.goTo(this.numSlides - 1);				
				} else {
					this._moveSlideLeft();
				}	
			},
			// go to next slide (cyclic)
			next:function() {
				//go from last to first
				if(this.currentSlideId >= this.numSlides - 1) {				
					this.goTo(0);		
				} else {
					this._moveSlideRight();
				}	
			},
			// handling browser resize	onresize
			updateSliderSize:function() {
				var self = this;
				this.slidesWrapperWidth = this._slidesWrapper.width()  ;
				this.slidesWrapperHeight = this._slidesWrapper.height() ;
				
				if(this.slidesWrapperWidth != this.sliderWidth || this.slidesWrapperHeight != this.sliderHeight) {
					this.sliderWidth = this.slidesWrapperWidth;
					this.sliderHeight = this.slidesWrapperHeight;
					
					var arLen=this.slidesArr.length;
					var _currItem, _currImg;					

					for ( var i=0, len=arLen; i<len; ++i ){
						_currItem = this.slidesArr[i];
						_currImg = _currItem.slide.find("img.royalImage")[0];
						if(_currImg && _currItem.preload == false) {							
							this._scaleImage($(_currImg), this.slidesWrapperWidth, this.slidesWrapperHeight);						
						}
						_currItem.slide.css({height: self.slidesWrapperHeight, width: self.slidesWrapperWidth});
					}
					if(!this._useWebkitTransition) {
						this._dragContainer.css({"left":-this.currentSlideId * this.sliderWidth, width:this.sliderWidth * this.numSlides});
					} else {
						this._dragContainer.css({'-webkit-transition-duration':'0ms',
							'-webkit-transition-property': 'none'});
						this._dragContainer.css({							
							'-webkit-transform': 'translate3d(' + -this.currentSlideId * this.sliderWidth + 'px, 0, 0)', 
							width:this.sliderWidth * this.numSlides
						});
					}
				}

			},
			resumeSlideshow: function(playedFromHover){
				if(this.settings.slideshowEnabled) {
					if(this.slideshowTimer == '') {
						if(playedFromHover) {
							if(!this._slideshowHoverLastState) {
								return;
							}
						}		
						var self = this;
						this.slideshowTimer = setInterval(function() { self.next(); }, this.settings.slideshowDelay);
						this.isSlideshowRunning = true;											
					}
				}			
			},	
			stopSlideshow: function(stoppedFromHover){
				if(this.settings.slideshowEnabled) {
					if(stoppedFromHover) {
						this._slideshowHoverLastState = 	this.isSlideshowRunning;
					} else {
						this._slideshowHoverLastState = false;
						this.isSlideshowRunning = false;
					}
					clearInterval(this.slideshowTimer);
					this.slideshowTimer = '';
				}					
			},				
			_preloadImage: function(slideObj, completeCallback) {				
				if(slideObj) {
					if(slideObj.preload) {
						var self = this;
						var img = new Image();
						var jqImg = $(img);
						jqImg.css("opacity",0);
						jqImg.addClass("royalImage");
						slideObj.slide.prepend(jqImg);		
						// add preloader
						slideObj.slide.prepend(this._preloader);					
						slideObj.preload = false;
						
						jqImg.load(function() {									
							self._scaleImage(jqImg, self.slidesWrapperWidth, self.slidesWrapperHeight);
							jqImg.animate({"opacity":1}, "fast");
							// remove preloader
							slideObj.slide.find(".royalPreloader").remove();
							if(completeCallback)
								completeCallback.call();					
						});
						img.src = slideObj.preloadURL;
					} else {
						if(completeCallback)
							completeCallback.call();					
					}
				} else {
					if(completeCallback)
						completeCallback.call();
				}
			},
			// animate thumbnails scroller
			_animateThumbs:function(newPosition) {	
				if(newPosition != this._currThumbsX) {
					if(newPosition <= this._minThumbsX) {
						newPosition = this._minThumbsX;
						this._thumbsArrowLeftBlocked = false;
						this._thumbsArrowRightBlocked = true;
						this.thumbsArrowRight.addClass("disabled");
						this.thumbsArrowLeft.removeClass("disabled");
					} else if(newPosition >= 0) {
						newPosition = 0;
						this._thumbsArrowLeftBlocked = true;
						this._thumbsArrowRightBlocked = false;
						this.thumbsArrowLeft.addClass("disabled");
						this.thumbsArrowRight.removeClass("disabled");
					} else {
						if(this._thumbsArrowLeftBlocked) {
							this._thumbsArrowLeftBlocked = false;
							this.thumbsArrowLeft.removeClass("disabled");
						} else if (this._thumbsArrowRightBlocked) {
							this._thumbsArrowRightBlocked = false;
							this.thumbsArrowRight.removeClass("disabled");
						}
					}
					if(!this._useWebkitTransition) {
						this._thumbsNavContainer.animate(
								{left: newPosition}, 
								this.settings.controlNavThumbsSpeed,
								this.settings.controlNavThumbsEasing
						);
					} else {	
						this._thumbsNavContainer.css({'-webkit-transform': 'translate3d(' + newPosition + 'px, 0, 0)'}); 
					}
					
					this._currThumbsX = newPosition;
				}
			},
			_startSlider:function() {
				var self = this;
				this.slider.find(".royalLoadingScreen").remove();

				if(this.settings.controlNavEnabled) {
					this.navItems.bind("click", function(e){ 
						e.preventDefault(); 
						if(!self._blockClickEvents)
							self._onNavItemClick(e);
					});
				}

				if(this.settings.directionNavEnabled) {
					this.arrowRight.click(function(e) {
						e.preventDefault();	
						if(!self._arrowRightBlocked && !self._blockClickEvents)
							self.next();
					});

					this.arrowLeft.click(function(e) {
						e.preventDefault();
						if(!self._arrowLeftBlocked && !self._blockClickEvents)
							self.prev();
					});	
				}
				// keyboard nav
				if(this.settings.keyboardNavEnabled) {
					$(document).bind("keydown", function(e) {
						if(!self._blockClickEvents) {
							if (e.keyCode === 37) {
								// left
								self.prev();
							}
							else if (e.keyCode === 39) {
								// right
								self.next();
							}
						}
					});
				}
				
				this._onSlideAnimationComplete();


				if(this.settings.slideshowEnabled && !this.settings.slideshowAutoStart) {
					this.stopSlideshow();
				}

				this.settings.allComplete.call(this);
			},
			_setGrabCursor:function() {
				if (!this.isIE7) {
					this._dragContainer.css("cursor",_grabCursor);
				}
			},
			_setGrabbingCursor:function() {
				if (!this.isIE7) {
					this._dragContainer.css("cursor",_grabbingCursor);
				}
			},
			_moveSlideRight:function() {			
				if(this.currentSlideId < this.numSlides - 1) {
					this.goTo(this.currentSlideId+1);			
				} else {
					this.goTo(this.currentSlideId);
				}		
			},
			_moveSlideLeft:function() {
				if(this.currentSlideId > 0) { 
					this.goTo(this.currentSlideId-1);
				} else {
					this.goTo(this.currentSlideId);
				}			
			},
			
			_onNavItemClick:function(e) {		
				this.goTo($(e.currentTarget).index(), true);	
			},
			// Start dragging the slide
			_onDragStart:function(e) {	

				if(!this._isDragging) {	
					var point;

					if(this.hasTouch) {
						//parsing touch event
						var currTouches = e.originalEvent.touches;
						if(currTouches && currTouches.length > 0) {
							point = currTouches[0];
						}					
						else {	
							return false;						
						}
					} else {
						point = e;
						e.preventDefault();		
					}

					if(this.slideshowTimer != '') {
						this.wasSlideshowPlaying = true;
						this.stopSlideshow();
					} else {
						this.wasSlideshowPlaying = false;
					}


					this._setGrabbingCursor();			
					this._isDragging = true;
					var self = this;
					if(this._useWebkitTransition) {
						self._dragContainer.css({'-webkit-transition-duration':'0ms', '-webkit-transition-property': 'none'});
					}
					$(document).bind(this._moveEvent, function(e) { self._onDragMove(e); });
					$(document).bind(this._upEvent, function(e) { self._onDragRelease(e); });		

					if(!this._useWebkitTransition) {
						this._startPos = this._tx = parseInt(this._dragContainer.css("left"), 10);	
					} else {						
						this._startPos = this._tx =  this._getWebkitTransformX();						
					}
					

					this._startMouseX = point.clientX;
					this._startMouseY = point.clientY;
				}	
				return false;	
			},			
			_getWebkitTransformX:function(){
				var transform = this._dragContainer.css("-webkit-transform");
				var explodedMatrix = transform.replace(/^matrix\(/i, '').split(/, |\)$/g);
				return parseInt(explodedMatrix[4], 10);
			},
			_onDragMove:function(e) {			
				var point;
				if(this.hasTouch) {
					var touches = e.originalEvent.touches;
					// If touches more then one, so stop sliding and allow browser do default action
					if(touches.length > 1) {
						return false;
					}
					point = touches[0];	
					// If drag direction on mobile is vertical, so stop sliding and allow browser to scroll
					if(Math.abs(point.clientY - this._startMouseY) + 10 > Math.abs(point.clientX - this._startMouseX)) {
						return false;
					}
					e.preventDefault();				
				} else {
					point = e;
					e.preventDefault();		
				}


				// Helps find last direction of drag move
				this._lastDragPosition = this._currentDragPosition;
				var distance = point.clientX - this._startMouseX;
				if(this._lastDragPosition != distance) {
					this._currentDragPosition = distance;
				}

				if(distance != 0)
				{			
					if(this.currentSlideId == 0) {			
						if(distance > 0) {
							distance = Math.sqrt(distance) * 5;
						}			
					} else if(this.currentSlideId == (this.numSlides -1)) {		
						if(distance < 0) {
							distance = -Math.sqrt(-distance) * 5;
						}	
					}
					if(!this._useWebkitTransition) {
						this._dragContainer.css("left", this._tx + distance);		
					} else {
						this._dragContainer.css({'-webkit-transform': 'translate3d(' +  (this._tx + distance) + 'px, 0, 0)'}); 
					}
				}			
				return false;		
			},
			_onDragRelease:function(e) {					
				if(this.wasSlideshowPlaying) {
					this.resumeSlideshow();
				}
				if(this._isDragging) {			
					this._isDragging = false;			
					this._setGrabCursor();
					if(!this._useWebkitTransition) {
						this.endPos = parseInt(this._dragContainer.css("left"), 10);
					} else {
						this.endPos = this._getWebkitTransformX();
					}
					
					this.isdrag = false;

					$(document).unbind(this._moveEvent).unbind(this._upEvent);					

					if(this.endPos == this._startPos) {
						return;	
					}	


					// calculate slide move direction
					if(this._startPos - this.settings.minSlideOffset > this.endPos) {		

						if(this._lastDragPosition < this._currentDragPosition) {		
							this.goTo(this.currentSlideId );
							return false;					
						}

						this._moveSlideRight();
					} else if(this._startPos + this.settings.minSlideOffset < this.endPos) {		
						if(this._lastDragPosition > this._currentDragPosition) {			
							this.goTo(this.currentSlideId );
							return false;
						}
						this._moveSlideLeft();

					} else {
						this.goTo(this.currentSlideId );
					}
				}

				return false;
			},		
			// Slide animation complete handler
			_onSlideAnimationComplete:function() {				
				var self = this;
				this.resumeSlideshow();
				this._blockClickEvents = false;

				this._dragContainer.bind(this._downEvent, function(e) {  self._onDragStart(e); });	

				if(this.settings.captionAnimationEnabled && this.lastSlideId != this.currentSlideId) {
					// hide last image caption
					if(this.lastSlideId != -1 ) {
						this.slidesArr[this.lastSlideId].caption.css("display", "none");					
					}
					setTimeout(function() { self._showCaption(self.currentSlideId);}, 10);			
				}
				this.isAnimating = false;
				this.settings.afterSlideChange.call(this);
			},			
			// Show caption with specified id
			_showCaption:function (id) {	
				var caption = this.slidesArr[id].caption;

				if(caption.length) {
					caption.css("display", "block");

					var self = this;	
					
					
					var currItem,
						fadeEnabled,
						moveEnabled,				
						effectName,	
						effectsObject,
						moveEffectProperty,
						currEffects,
						newEffectObj,	
						moveOffset,
						delay,
						speed,
						easing,
						moveProp;
					
					var captionItems = caption.children();
					
					// clear previous animations
					if(this._captionAnimateTimeouts.length > 0) {
						for(var a = this._captionAnimateTimeouts.length - 1; a > -1; a--) {  
							clearTimeout(this._captionAnimateTimeouts.splice(a, 1));
						}
					}
					if(this._captionAnimateProperties.length > 0) {						
						var cItemTemp;
						for(var k = this._captionAnimateProperties.length - 1; k > -1; k--) {  
							cItemTemp = this._captionAnimateProperties[k];							
							if(cItemTemp) {								
								if(!this._useWebkitTransition) {
									if(cItemTemp.running) {
										cItemTemp.captionItem.stop(true, true);
									} else {
										cItemTemp.captionItem.css(cItemTemp.css);
									}
								}		
							}
							this._captionAnimateProperties.splice(k, 1);
						}
						
					}
					
					
					// parse each caption item on slide
					for(var i = 0; i < captionItems.length; i++) {
						currItem = $(captionItems[i]);		

						effectsObject = {};
						fadeEnabled = false;
						moveEnabled = false;
						moveEffectProperty = "";
						
						if(currItem.attr("data-show-effect") == undefined) {
							currEffects = this.settings.captionShowEffects;	
						} else {
							currEffects = currItem.attr("data-show-effect").split(" ");
						}

						// parse each effect in caption
						for(var q = 0; q < currEffects.length; q++) {			

							if(fadeEnabled && moveEnabled) {
								break;	
							}			

							effectName = currEffects[q].toLowerCase();

							if(!fadeEnabled && effectName == "fade") {
								fadeEnabled = true;
								effectsObject['opacity'] = 1;
							} else if(moveEnabled) {
								break;
							} else if(effectName == "movetop") {
								moveEffectProperty = "margin-top";
							} else  if(effectName == "moveleft") {
								moveEffectProperty = "margin-left";
							} else  if(effectName == "movebottom") {						
								moveEffectProperty = "margin-bottom";
							} else  if(effectName == "moveright") {
								moveEffectProperty = "margin-right";
							}

							if(moveEffectProperty != "") {
								effectsObject['moveProp'] = moveEffectProperty;	
								if(!self._useWebkitTransition) { 
									effectsObject['moveStartPos'] = parseInt(currItem.css(moveEffectProperty), 10);
								} else {
									effectsObject['moveStartPos'] = 0;
								}
								
								moveEnabled = true;
							}



						}

						moveOffset = parseInt(currItem.attr("data-move-offset"), 10);					
						if(isNaN(moveOffset)) {					
							moveOffset = this.settings.captionMoveOffset;
						}

						delay = parseInt(currItem.attr("data-delay"), 10);		
						if(isNaN(delay)) {
							delay = self.settings.captionShowDelay * i + 10;
						}

						speed = parseInt(currItem.attr("data-speed"), 10);		
						if(isNaN(speed)) {
							speed = self.settings.captionShowSpeed;
						}

						easing = currItem.attr("data-easing");
						if(!easing) {
							easing = self.settings.captionShowEasing;
						}

						newEffectObj = {};

						if(moveEnabled) {	
							moveProp = effectsObject.moveProp;
							if(moveProp == "margin-right") {						
								moveProp = "margin-left";
								newEffectObj[moveProp] = effectsObject.moveStartPos + moveOffset;						
							} else if(moveProp == "margin-bottom") {
								moveProp = "margin-top";
								newEffectObj[moveProp] = effectsObject.moveStartPos + moveOffset;	
							} else {								
								newEffectObj[moveProp] = effectsObject.moveStartPos - moveOffset;				
							}
						}
						
						if(!self._removeFadeAnimation && fadeEnabled) {							
							currItem.css("opacity",0);							
						}
						
						if(!self._useWebkitTransition) {							
							currItem.css("visibility","hidden");
							currItem.css(newEffectObj);	
							if(moveEnabled) {	
								newEffectObj[moveProp] = effectsObject.moveStartPos; 
							}
							if(!self._removeFadeAnimation && fadeEnabled) {
								newEffectObj.opacity = 1;
							}
						} else {
							var cssObj = {};
							if(moveEnabled) {
								cssObj['-webkit-transition-duration'] = "0ms";
								cssObj['-webkit-transition-property'] = "none";
								
								cssObj["-webkit-transform"] = "translate3d("
									+ (isNaN(newEffectObj["margin-left"]) ? 0 : (newEffectObj["margin-left"] + "px")) 
									+ ", "
									+ (isNaN(newEffectObj["margin-top"]) ? 0 : (newEffectObj["margin-top"] + "px")) 
									+",0)";
								delete newEffectObj["margin-left"];
								delete newEffectObj["margin-top"];
								
								newEffectObj["-webkit-transform"] = "translate3d(0,0,0)";
								
							}
							newEffectObj.visibility = "visible";
							if(!self._removeFadeAnimation && fadeEnabled) {
								newEffectObj.opacity = 1;							
								cssObj["opacity"] = 0;
							}
							cssObj["visibility"] = "hidden";	
							currItem.css(cssObj);
						}
						
						
							

						this._captionAnimateProperties.push({captionItem:currItem, css:newEffectObj, running:false});
						// animate caption
						this._captionAnimateTimeouts.push(setTimeout((function (cItem, animateData, cSpeed, cEasing, cId, objFadeEnabled, objMoveEnabled) {	
							return function() {									
								self._captionAnimateProperties[cId].running = true;
								if(!self._useWebkitTransition) {
									cItem.css("visibility","visible").animate(animateData, cSpeed, cEasing, function(){										
										delete self._captionAnimateProperties[cId];
									});
								} else {									
									cItem.css({'-webkit-transition-duration': (speed + "ms"), 
										'-webkit-transition-property': 'opacity, -webkit-transform',
										'-webkit-transition-timing-function':'ease-out'});
									cItem.css(animateData);
								}
							};
						})(currItem, newEffectObj, speed, easing, i, fadeEnabled, moveEnabled), delay));				
					}		
				}		
			},	/* _showCaption end */
			// scale image and center it if needed
			_scaleImage:function(img, containerWidth, containerHeight) {	
				
				var imgScaleMode = this.settings.imageScaleMode;
				var imgAlignCenter = this.settings.imageAlignCenter;
				
				if(imgAlignCenter || imgScaleMode == "fill" || imgScaleMode == "fit") {			
					
					var isReloaded = false;			
					function scaleImg () {						
						var hRatio, vRatio, ratio, nWidth, nHeight;
						var _tempImg = new Image();
						_tempImg.src = img.attr("src");               
						
						var imgWidth = _tempImg.width;
						var imgHeight = _tempImg.height;
						var imgBorderSize = parseInt(img.css("borderWidth"), 10);            	
						imgBorderSize = isNaN(imgBorderSize) ? 0 : imgBorderSize;
						
						// fix bug, that prevents getting image real size
						if(isNaN(imgWidth) || isNaN(imgHeight) || imgWidth === 0 || imgHeight === 0) {
							if(!isReloaded) {								
								$('<img />').load( function(){
									isReloaded = true;
									scaleImg();
								}).attr('src', _tempImg.src);
								return;
							}							
						}
						
						
						if(imgScaleMode == "fill" || imgScaleMode == "fit") {						
							
	
							hRatio = containerWidth / imgWidth;
							vRatio = containerHeight / imgHeight;
	
							if (imgScaleMode  == "fill") {
								ratio = hRatio > vRatio ? hRatio : vRatio;                    			
							} else if (imgScaleMode  == "fit") {
								ratio = hRatio < vRatio ? hRatio : vRatio;             		   	
							} else {
								ratio = 1;
							}
	
							nWidth = parseInt(imgWidth * ratio, 10) - imgBorderSize;
							nHeight = parseInt(imgHeight * ratio, 10) - imgBorderSize;
	
							img.attr({"width":nWidth, "height":nHeight})
							.css({"width": nWidth, "height": nHeight});
						} else {
							nWidth = imgWidth - imgBorderSize;
							nHeight = imgHeight - imgBorderSize;
						}
						// center image in needed
						if (imgAlignCenter) {            		
							img.css({"margin-left": Math.floor((containerWidth - nWidth) / 2), "margin-top":Math.floor((containerHeight - nHeight) / 2)});            		
						}    		
						img.css("visibility","visible");
						
					};
					img.css("visibility","hidden");
					img.removeAttr('height').removeAttr('width');	
					
					if (!this._isImageLoaded(img.get(0))) { 
						
						$('<img />').load( function(){							
							scaleImg();
						}).attr('src', img.attr("src"));						
					} else {						
						scaleImg();
					}
				};
			},   /* _scaleImage end */
			_isImageLoaded:function (img) {
			    if (!img.complete) {
			        return false;
			    }
			    if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
			        return false;
			    }
			    return true;
			} /* _isImageLoaded end */
	}; /* RoyalSlider.prototype end */

	$.fn.royalSlider = function(options) {    	
		return this.each(function(){
			var royalSlider = new RoyalSlider($(this), options);
			$(this).data("royalSlider", royalSlider);
		});
	};

	$.fn.royalSlider.defaults = {    
			preloadNearbyImages:true,               // Preloads two nearby images, if lazy loading is enabled.
			imageScaleMode:"none",                  // Scale mode of images. "fill", "fit" or "none"
			imageAlignCenter:false,					// Aligns all images to center.
			
			keyboardNavEnabled:false,				// Keyboard arrows navigation
			
			

			directionNavEnabled:true,               // Direction (arrow) navigation (true or false)
			directionNavAutoHide:false,             // Direction (arrow) navigation auto hide on hover. (On touch devices arrows are always shown)
			hideArrowOnLastSlide:false,             // Auto hide right arrow on last slide and left on first slide. Always true for touch devices.


			slideTransitionSpeed:400,               // Slide transition speed in ms (1000ms = 1s)
			slideTransitionEasing:"easeInOutSine",  // Easing type for slide transition. Types: http://hosted.zeh.com.br/tweener/docs/en-us/misc/transitions.html

			captionAnimationEnabled:true,           // Set to false if you want to remove all animations from captions  
			captionShowEffects:["fade","moveleft"], // Default array of effects: 
			// ["fade" or "" + "moveleft", or "moveright", or "movetop", or "movebottom"]
			captionMoveOffset:20,                   // Default distance for move effect in px
			captionShowSpeed:400,                   // Default caption show speed in ms
			captionShowEasing:"easeOutCubic",       // Default caption show easing
			captionShowDelay:200,                   // Default delay between captions on one slide show

			controlNavEnabled:true,                 // Control navigation (bullets, thumbs)  enabled
			controlNavThumbs:false,	                // Use thumbs for control navigation (use data-thumb="myThumb.jpg" attribute in html royalSlide item)
			controlNavThumbsNavigation:true,        // Enables navigation for thumbs
			controlNavThumbsSpeed:400,				// Thumbnails navigation move speed (1000ms = 1s)
			controlNavThumbsEasing:"easeInOutSine", // Thumbnails navigation easing type

			slideshowEnabled:false,                 // Autoslideshow enabled          
			slideshowDelay:5000,                    // Delay between slides in slideshow
			slideshowPauseOnHover:true,             // Pause slideshow on hover
			slideshowAutoStart:true,                // Auto start slideshow 

			welcomeScreenEnabled:true,              // Welcome (loading) screen enabled
			welcomeScreenShowSpeed:500,             // Welcome screen fade out speed

			minSlideOffset:20,                      // Minimum distance in pixels to show next slide while dragging
			
			disableTranslate3d:false,   			// Disables CSS3 transforms on touch devices

			removeCaptionsOpacityInIE8:false,        // If animated caption with fade effect has no background color, so turn this option on. 
			// Fix for pixelated text bug in IE8 and lower. Removes fade effect animation.

			beforeSlideChange: function(){},        // Callback, triggers before slide transition
			afterSlideChange: function(){},         // Callback, triggers after slide transition

			beforeLoadStart:function() {},			// Callback, triggers before first image loading starts
			loadingComplete: function() {},         // Callback, triggers after loading complete, but before welcome screen animation
			allComplete: function() {}				// Callback, triggers after loading and welcome screen animation
	}; /* default options end */

	$.fn.royalSlider.settings = {};

})(jQuery);
