/* Welcome to the source code of opticode.ch.
 * Have fun reading them. I got inspired by many sites, for example http://demojs.org.
 * Stackoverflow.com is always a very useful source of information.
 * 
 * Feel free to copy and re-use what you find here. Comments are welcome.
 * Thank you for your interest.
 * Julien Pilet - julien.pilet@opticode.ch
 */

// Returns an array with: full location hash, section name, section subpath.
function parseLocationHash() {
  var hash = (location.hash && location.hash != "" ? location.hash: "#home");
  return hash.match(/#([a-zA-Z0-9_-]+)(\/.*)?/);
}

function currentSectionName() {
  return parseLocationHash()[1];
}

function currentSection() {
  return $('#' + currentSectionName());
}

function resizeBlog() {
  var iframe = $('#blog iframe')[0];
  try {
    if (iframe && iframe.contentWindow && iframe.contentWindow.document && iframe.contentWindow.document.body) {
      iframe.style.height = iframe.contentWindow.document.body.scrollHeight + "px";
    }
  } catch (err) {
    // we ignore a potential access denied error
  }
}

jQuery( function($){
	var activeMenuEntryForSection = {
		"home": "home",
		"service-vision": "services",
		"service-academic": "services",
		"service-embedded": "services",
		"service-dev": "services",
		"service-code-review": "services",
		"video": "video",
		"contact": "contact",
		"index": "index",
		"blog": "blog",
	};
	var geometry = {
		sectionWidth: 0,
		sectionHeight: 0,
		clipZoneWidth: 0,
		clipZoneHeight: 0,
		bounds: {
			width: 0,
			height: 0,
		}
	};
			
	function computeBounds() {
		var bounds = geometry.bounds;
		var maxX = -1000;
		var minX = 1000;
		var maxY = -1000;
		var minY = 1000;
		
		// sectionPosition depends on bounds.width and bounds.height, which are
		// not known at this point. However, it is just a translation
		// that has no impact on width and height.
		bounds.width = 0;
		bounds.height = 0;
		$("section").each(function() {
			var pos = sectionPosition(this);
			var x = pos.left;
			var y = pos.top;
			maxX = Math.max(maxX, x + geometry.sectionWidth);
			minX = Math.min(minX, x);
			maxY = Math.max(maxY, y + geometry.sectionHeight);
			minY = Math.min(minY, y);
		});
		bounds.width = Math.max(maxX * 2, - minX * 2);
		bounds.height = Math.max(maxY * 2, - minY * 2);
	}
		
	function placeSections() {		
		computeBounds();
		$("#content").css({
			"width": geometry.bounds.width,
			"height": geometry.bounds.height,
		});
		
		$("section").each(function() {
			$(this).css(sectionPosition(this));
		});
	}

	function resizeSections() {
		var height = window.innerHeight, width = window.innerWidth;
		var clipZone = $("#clipZone");
		var headerHeight = clipZone[0].offsetTop;
		
		geometry.clipZoneWidth = width;
		geometry.clipZoneHeight = (height - headerHeight);
		clipZone.css({
			"height": geometry.clipZoneHeight + "px",
			"width" : geometry.clipZoneWidth + "px",
		});
		
		// Return a small value if 'size' if significantly smaller than 'normalSize'
		// if 'size' is about 'normalSize', return normalSize * ratio.
		// if 'size' is much larger, return a large value.
		// We make sur it is an integer value, to avoid translating text of a fraction of a pixel.
		var squareProgressive = function(size, normalSize, ratio) {
			return Math.floor((size / normalSize) * (size * ratio));
		};
		geometry.sectionWidth = geometry.clipZoneWidth - 2 * squareProgressive(geometry.clipZoneWidth, 800, .07);
		geometry.sectionHeight = geometry.clipZoneHeight - 2 * squareProgressive(geometry.clipZoneHeight, 800, .07);
		var border = {
			width: squareProgressive(geometry.clipZoneWidth, 800, .07),
			height: squareProgressive(geometry.clipZoneHeight, 800, .07),
		};
		$("section").css({
			"height" : (geometry.sectionHeight - border.height) + "px",
			"width" : (geometry.sectionWidth - border.width) + "px",
			"border-width": border.height + "px 0px " + border.height + "px " + border.width + "px",
			"padding-right": border.width + "px",
		});
		
		resizeBlog();
		placeSections();
		selectSection();
	}
	

	
	function sectionPosition(section) {
		var angle = $(section).attr("data-angle") * Math.PI / 180.0;
		var sin = Math.sin(angle);
		var cos = Math.cos(angle);
		var r = $(section).attr("data-radius") * 1.6;

		return {
			left: Math.floor(cos * r * geometry.sectionWidth - (geometry.sectionWidth / 2) + geometry.bounds.width / 2),
			top: Math.floor(sin * r * geometry.sectionHeight - (geometry.sectionHeight / 2) + geometry.bounds.height / 2)
		};
	}
	
	var previousTranslation = null;
	function selectSection() {
		function translationForSection(section) {
			var pos = sectionPosition(section);
			return {
				left: (geometry.clipZoneWidth - $(section).outerWidth()) / 2 - pos.left,
				top: (geometry.clipZoneHeight - $(section).outerHeight()) / 2 - pos.top,
				z: 0
			};
		}
		
    var section = currentSection();   
    var pos = translationForSection(section);
    var previousSection = $("section.selectedSection");
		var parsedLocation = parseLocationHash();
		if (parsedLocation[1] == 'blog') {
      var iframe = $('#blog iframe')[0];
		  if (parsedLocation[2]) {
  		  var newSrc = 'http://opticode.ch/blog' + parsedLocation[2];
  		  if (iframe.contentWindow.location.href != newSrc) {
  		    iframe.src = newSrc;
  		  }
  		} else {
  		  if (iframe.contentWindow.location.href.match(/opticode.ch\/blog\/./)) {
  		    window.location += iframe.contentWindow.location.href.replace(/.*opticode.ch\/blog/,'');
  		    return;
  		  }
  		}
		}
		
		if (previousTranslation && section[0] === previousSection[0]) {
		  // nothing to do.
		  return;
		}
		
	  section.addClass("selectedSection");

		if (previousTranslation && Modernizr.cssanimations) {

			var mid = {
				left: (previousTranslation.left + pos.left) / 2,
				top: (previousTranslation.top + pos.top) / 2,
				z: (previousTranslation.z + pos.z) / 2 - 200
			};
			
			var anim = Zanimo($("#content")[0]);
			var animBackground = Zanimo($("#background")[0]);
			var slowFactor = .5;
			
			var animDuration = 1400;
			var easingIn = 'cubic-bezier(0.630, 0.005, 0.755, 0.995)';
			var easingOut = 'cubic-bezier(0.145, 0.000, 0.475, 1.000)';
			if (Modernizr.csstransforms3d) {
				anim = anim
					.then(Zanimo.transitionf("transform",
						"translate3d(" + mid.left + "px," + mid.top + "px, " + mid.z + "px)", animDuration/2, easingIn))
					.then(Zanimo.transitionf("transform",
						"translate3d(" + pos.left + "px," + pos.top + "px, " + pos.z + "px)", animDuration/2, easingOut));
				animBackground = animBackground
					.then(Zanimo.transitionf("transform",
						"translate3d(" + mid.left * slowFactor + "px," + mid.top * slowFactor + "px, " + mid.z + "px)", animDuration/2, easingIn))
					.then(Zanimo.transitionf("transform",
						"translate3d(" + pos.left * slowFactor + "px," + pos.top * slowFactor + "px, " + pos.z + "px)", animDuration/2, easingOut))
          .then(function() { previousSection.removeClass("selectedSection"); });
				
			} else {
				anim = anim.then(Zanimo.transitionf("transform", "translate(" + pos.left + "px," + pos.top + "px)", animDuration, "ease-in-out"));
				animBackground = animBackground
					.then(Zanimo.transitionf("transform",
                                   "translate(" + pos.left * slowFactor + "px," + pos.top * slowFactor+ "px)",
                                   animDuration, "ease-in-out"))
          .then(function() { previousSection.removeClass("selectedSection"); });
			}
			anim.fail(function() {
				$("#content").css({
					"transform": "translate(" + pos.left + "px," + pos.top + "px)"
				});
				previousSection.removeClass("selectedSection");
			});
		} else {
			// Initial selection: no animation, or no animation support.
			$("#content").css({
				"transform": "translate(" + pos.left + "px," + pos.top + "px)"
			});
			previousSection.removeClass("selectedSection");
		}
		previousTranslation = pos;
		
		// Activate the menu.
		$(".activeMenuItem").removeClass("activeMenuItem");
		if (currentSectionName() in activeMenuEntryForSection) {
			$('nav ul a[href="#' + activeMenuEntryForSection[currentSectionName()] + '"]').parent().addClass("activeMenuItem");
		}
	}
	
	// Browsers try to scroll to the correct location.
	// Make sure to reset scrolling, we'll pace stuff ourselves.
	$("#clipZone").scroll(function() {
		this.scrollLeft = 0;
		this.scrollTop = 0;
	});
	
	//$(".opticodeLogo").html('<a href="#home">opticod<span class="inverseVideo">e</span>.ch</a>');
	$(".opticodeLogo").html('opticode.ch');
	
	window.onresize = _.debounce( function() {
			previousTranslation = null;
			resizeSections();
		} , 20);
  window.onhashchange = function() {
    ga('send', 'pageview', window.location.pathname + window.location.search + window.location.hash);
    selectSection();
  };
	window.onresize();
	
        $('#blog iframe').attr('src', window.location.protocol + '//' + window.location.hostname + '/blog/');
	
	// Fill the index section
	var index = "<ul>";
	$("section").each(function() {
		var id = $(this).attr("id");
		if (id != "index") {
			index += '<li><a href="#' + id + '">' + $(this).find("h1").html() + '</a></li>';
		}
	});
	index += "</ul>";
	$('#indexContainer').html(index);
	
	// Duplicate navigation bar in all sections
	$("section").prepend($("#home nav"));
	
	// Format youtube references
	$(".youtubeIcon").each(function() {
		$(this).html('<iframe width="420" height="315" src="//www.youtube.com/embed/'
			+ $(this).attr("data-youtubeid") + '?rel=0&theme=light&color=white" frameborder="0" allowfullscreen></iframe>'
			+ '<span>' + $(this).html() + '</span>');
	});
});

function blogIframeLoaded() {
  if (currentSectionName() == 'blog') {
    var iframe = $('#blog iframe')[0];
    var newLocation = iframe.contentWindow.location.href.replace(/.*opticode.ch\/blog/,
      window.location.origin + window.location.pathname + window.location.search + '#blog');
    if (newLocation && newLocation != window.location.href) {
        window.location = newLocation;
    }
  }
  resizeBlog();
}
