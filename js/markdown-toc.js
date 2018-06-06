


;(function($)
{

	$.fn.extend(
	{
		/**
		 * 简单的markdown生成TOC工具，这个只是生成toc代码，具体页面展示自己去实现
		 * 会自动修正一些不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
		 * @start 2016-07-10
		 * @last 2016-07-18
		 * @author lxa
	 	 */
		getMarkdownTOC: function()
		{
			let currentHash = location.pathname + location.hash;
			// list存放[[标题层级，标题ID，标题名称]]
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');
			if(elements.length == 0) return '';
			for(var i=0; i<elements.size(); i++)
			{
				var obj = elements[i];
				var level = parseInt(obj.nodeName.substr(1)); // 提取h1~h6中的数字
				// 这一步是为了修正一些可能不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
				for(var j = (list[list.length-1] || [0])[0] + 1; j<level; j++) list.push([j, '', '']);
				list.push([level, obj.id, $(obj).text()]);
			}
			var target = $('<div></div>').appendTo($(document.createDocumentFragment()));
			var level, lastOl, html, parent;
			for(var i=0; i<list.length; i++)
			{
				level = list[i][0];
				html = '<li><a href="'+currentHash+'#'+list[i][1]+'">'+list[i][2]+'</a></li>';
				parent = level <= 1 ? target : target.find('ol[data-level="'+(level-1)+'"]:last > li:last');
				lastOl = parent.children('ol[data-level="'+level+'"]:last');
				if(lastOl.length == 0) lastOl = $('<ol data-level="'+(level)+'"></ol>').appendTo(parent);
				lastOl.append(html);
			}
			return '<div class="markdown-toc">' + target.html() + '</div>';
		},
		/**
		 * 给H1-H6添加数字导航，如1.3.6
		 * 注意，必须在getMarkdownTOC()方法之后调用本方法，否则获取到的内容会有多余的类似“1.2.1”这样的东西
		 */
		addNumberBeforeHeaderline: function(ignoreH1)
		{
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');			
			for(var i=0; i<elements.size(); i++)
			{
				var level = parseInt(elements[i].nodeName.substr(1)); // 提取h1~h6中的数字
				// 这一步是为了修正一些可能不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
				for(var j = (list[list.length-1] || [0])[0] + 1; j<level; j++) list.push([j, -1]);
				list.push([level, i]);
			}
			var h = []; // 记录每一个层级最高的索引
			for(var i=0; i<list.length; i++)
			{
				var level = list[i][0];
				var result = '';
				h[level] = (h[level] || 0) + 1; // 从0开始自增
				for(var j=level+1; j<=6; j++) h[j] = 0; // 例如，h2自增后，h2后面的h3-h6都要归零
				for(var j=1; j<=level; j++) result += h[j] + '.';
				if(ignoreH1 && level == 1) continue;
				$(elements[list[i][1]]).prepend(result + ' ');
			}
		},
		/**
		 * 初始化当前内容滚动监听
		 */
		initScroll: function()
		{
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');
			if(elements.length == 0) return;
			for(var i=0; i<elements.size(); i++)
			{
				var obj = elements[i];
				list.push([obj.id, getAbsolutePosition(obj).top]);
			}
			list.sort(function(a, b)
			{
				if(a[1] < b[1]) return -1;
				if(a[1] > b[1]) return 1;
				return 0;
			});
			var _target = undefined;
			$(window).on('scroll', function(e)
			{
				refresh();
			});
			function refresh()
			{
				var top = document.body.scrollTop;
				var target = undefined;
				for(var i=0; i< list.length; i++)
				{
					if(list[i][1] >= (top + 20))
					{
						target = list[i][1] == top ? list[i][0] : (i > 0 ? list[i-1][0] : list[i][0]);
						break;
					}
				}
				if(!target) target = list[list.length-1][0];
				if(target == _target) return;
				_target = target;
				$('.markdown-nav-content a.active').removeClass('active');
				var obj = $('.markdown-nav-content [href="#'+target+'"]');
				obj.addClass('active');
				var markdownNav = $('.markdown-nav-content')[0]; // 滚动目标
				var top = getPositionUntil(obj[0], markdownNav).top;
				var height = $('.markdown-nav-content').height();
				var scrollTop = top - (height/2);
				markdownNav.scrollTop = scrollTop < 0 ? 0 : scrollTop;
			}
			refresh();
			function getAbsolutePosition(elem)
			{
			    if(elem == null) return {left: 0, top: 0, width: 0, height: 0};
			    var left = elem.offsetLeft,
			        top = elem.offsetTop,
			        width = elem.offsetWidth,
			        height = elem.offsetHeight;
			    while(elem = elem.offsetParent)
			    {
			        left += elem.offsetLeft;
			        top += elem.offsetTop;
			    }
			    return {left: left, top: top, width: width, height: height};
			}
			
			function getPositionUntil(elem, until)
			{
			    if(elem == null) return {left: 0, top: 0, width: 0, height: 0};
			    var left = elem.offsetLeft,
			        top = elem.offsetTop,
			        width = elem.offsetWidth,
			        height = elem.offsetHeight;
			    while(true)
			    {
			    	elem = elem.offsetParent;
			    	if(!elem || elem == until) break;
			        left += elem.offsetLeft;
			        top += elem.offsetTop;
			    }
			    return {left: left, top: top, width: width, height: height};
			}
			
		},
		initMarkdownTOC: function(context)
		{
			context = context || $('body');
			var toc = context.getMarkdownTOC();
			var storageId = 'is_show_markdown_toc';
			if(!toc) return;
			var html = '<div class="markdown-nav-wrapper">'+
							'<div class="markdown-nav-sidebar"></div>'+
							'<div class="markdown-nav-content">'+
								'<div class="title">文章目录：</div>'+
								toc+
							'</div>'+
							'<div class="markdown-nav-btn"><i class="fa fa-list-ul" title="显示或隐藏文章目录"></i></div>'+
						'</div>';
			$('.markdown-nav-wrapper').remove();
			this.append(html);
			$('.markdown-nav-wrapper a').click(function(e){
				e.preventDefault();
				var header = $('#'+this.innerHTML);
				$('html, body').animate({
					scrollTop: header.offset().top
				}, 200);
			});
			$('.markdown-nav-btn > .fa').on('click', function()
			{
				var obj = $(this).parents('.markdown-nav-wrapper');
				obj.toggleClass('hide');
				localStorage[storageId] = (!obj.hasClass('hide')) + '';
			});
			$(window).on('load', function()
			{
				context.initScroll();
			});
			function refreshScroll()
			{
				// 这里注意，比较新的浏览器 document.body.scrollTop 一直都返回0
				// var top = document.documentElement.scrollTop;
				var top = window.pageYOffset;
				if(top <= 100) $('.markdown-nav-wrapper').addClass('hide');
				else if(localStorage[storageId]!='false') $('.markdown-nav-wrapper').removeClass('hide');
			}
			/* refreshScroll();
			$(window).on('scroll', function(e)
			{
				refreshScroll();
			}); */
		}
	});
})(jQuery);