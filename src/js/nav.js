/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';
	var clickScroll = false;
	
	function init() {
		$(".nav").find("a").click(function (e) {
        e.preventDefault();

        var section = $(this).attr("href");

        $('.nav__item--current').removeClass('nav__item--current');
        $("html, body").animate({
            scrollTop: $(section).offset().top + 60
        });
        $(this).addClass('nav__item--current');
        clickScroll = true;

        setTimeout(function () {
            clickScroll = false;
        }, 1000);
    });

		// [].slice.call(document.querySelectorAll('.link-copy')).forEach(function(link) {
		// 	link.setAttribute('data-clipboard-text', location.protocol + '//' + location.host + location.pathname + '#' + link.parentNode.id);
		// 	new Clipboard(link);
		// 	link.addEventListener('click', function() {
		// 		link.classList.add('link-copy--animate');
		// 		setTimeout(function() {
		// 			link.classList.remove('link-copy--animate');
		// 		}, 300);
		// 	});
		// });

		$(document).scroll(function () {
			var y = $(document).scrollTop();


			if (!clickScroll) {
	            $('.nav__item').each(function () {
	                var currentLink = $(this);
	                var refElement = $(currentLink.attr("href"));
	                var height = refElement.position().top - 60;
	                if (height <= y && height + refElement.height() > y) {
	                    $('.nav a').removeClass("nav__item--current");
	                    currentLink.addClass("nav__item--current");
	                } else {
	                    currentLink.removeClass("nav__item--current");
	                }
	            });
	        }
	    })

	}



	init();

})(window);