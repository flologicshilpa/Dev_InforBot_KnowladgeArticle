
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) define(['jquery'], factory);
    else if (typeof exports === 'object') factory(require('jquery'));
    else factory(jQuery);

}(function($) {
    'use strict';
    $.Zebra_DatePicker = function(element, options) {

        var defaults = {
            always_visible: false,
            container: $('body'),
            custom_classes: false,
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            days_abbr: false,
            default_position: 'above',
            direction: 0,
            disabled_dates: false,
            enabled_dates: false,
            first_day_of_week: 1,
            format: 'Y-m-d',
            header_captions: {
                'days':     'F, Y',
                'months':   'Y',
                'years':    'Y1 - Y2'
            },
            header_navigation: ['&#171;', '&#187;'],
            icon_position: 'right',
            inside: true,
            lang_clear_date: 'Clear date',
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            months_abbr: false,
            offset: [5, -5],
            open_icon_only: false,
            pair: false,
            readonly_element: true,
            select_other_months: false,
            show_clear_date: 0,
            show_icon: true,
            show_other_months: true,
            show_select_today: 'Today',
            show_week_number: false,
            start_date: false,
            strict: false,
            view: 'days',
            weekend_days: [0, 6],
            zero_pad: false,
            onChange: null,
            onClear: null,
            onOpen: null,
            onClose: null,
            onSelect: null

        };
		
        // private properties
        var view, datepicker, icon, header, daypicker, monthpicker, yearpicker, cleardate, current_system_month, current_system_year,
            current_system_day, first_selectable_month, first_selectable_year, first_selectable_day, selected_month, selected_year,
            default_day, default_month, default_year, enabled_dates, disabled_dates, shim, start_date, end_date, last_selectable_day,
            last_selectable_year, last_selectable_month, daypicker_cells, monthpicker_cells, yearpicker_cells, views, clickables,
            selecttoday, footer, show_select_today, timeout, uniqueid, custom_classes, custom_class_names, original_attributes = {};

        var plugin = this;

        plugin.settings = {};

        // the jQuery version of the element
        var $element = $(element);
        var init = function(update) {
            uniqueid = Math.floor((1 + Math.random()) * 0x10000).toString(16);

            if (!update) {
                plugin.settings = $.extend({}, defaults, options);
                original_attributes['readonly'] = $element.attr('readonly');
                original_attributes['style'] = $element.attr('style');
                for (var data in $element.data())
                    if (data.indexOf('zdp_') === 0) {
                        data = data.replace(/^zdp\_/, '');
                        if (undefined !== defaults[data])
                            plugin.settings[data] = (data == 'pair' ? $($element.data('zdp_' + data)) : $element.data('zdp_' + data));
                    }
            }

            // if the element should be read-only, set the "readonly" attribute
            if (plugin.settings.readonly_element) $element.attr('readonly', 'readonly');
            var date_chars = {
                days:   ['d', 'j', 'D'],
                months: ['F', 'm', 'M', 'n', 't'],
                years:  ['o', 'Y', 'y']
            },

                // some defaults
                has_days = false,
                has_months = false,
                has_years = false,
                type = null;

            for (type in date_chars)
                $.each(date_chars[type], function(index, character) {
                    if (plugin.settings.format.indexOf(character) > -1)
                        if (type == 'days') has_days = true;
                        else if (type == 'months') has_months = true;
                        else if (type == 'years') has_years = true;

                });

            // if user can cycle through all the views, set the flag accordingly
            if (has_days && has_months && has_years) views = ['years', 'months', 'days'];
            else if (!has_days && has_months && has_years) views = ['years', 'months'];
            else if (has_days && has_months && !has_years) views = ['months', 'days'];
            else if (!has_days && !has_months && has_years) views = ['years'];
            else if (!has_days && has_months && !has_years) views = ['months'];
            else views = ['years', 'months', 'days'];

            
            if ($.inArray(plugin.settings.view, views) == -1) plugin.settings.view = views[views.length - 1];
            disabled_dates = []; enabled_dates = []; custom_classes = {}; custom_class_names = [];

            var dates;
			
            for (var k in plugin.settings.custom_classes) if (plugin.settings.custom_classes.hasOwnProperty(k)) custom_class_names.push(k);

            for (var l = 0; l < 2 + custom_class_names.length; l++) {
                if (l === 0) dates = plugin.settings.disabled_dates;
                else if (l == 1) dates = plugin.settings.enabled_dates;
                else dates = plugin.settings.custom_classes[custom_class_names[l - 2]];
                if ($.isArray(dates) && dates.length > 0)
                    $.each(dates, function() {
                        var rules = this.split(' ');
                        for (var i = 0; i < 4; i++) {
                            if (!rules[i]) rules[i] = '*';
                            rules[i] = (rules[i].indexOf(',') > -1 ? rules[i].split(',') : new Array(rules[i]));
                            for (var j = 0; j < rules[i].length; j++)
                                if (rules[i][j].indexOf('-') > -1) {
                                    var limits = rules[i][j].match(/^([0-9]+)\-([0-9]+)/);
                                    if (null !== limits) {
                                        for (var k = to_int(limits[1]); k <= to_int(limits[2]); k++)
                                            if ($.inArray(k, rules[i]) == -1) rules[i].push(k + '');
                                        rules[i].splice(j, 1);
                                    }

                                }
                            for (j = 0; j < rules[i].length; j++) rules[i][j] = (isNaN(to_int(rules[i][j])) ? rules[i][j] : to_int(rules[i][j]));

                        }
                        if (l === 0) disabled_dates.push(rules);
                        else if (l == 1) enabled_dates.push(rules);
                        else {
                            if (undefined === custom_classes[custom_class_names[l - 2]]) custom_classes[custom_class_names[l - 2]] = [];
                            custom_classes[custom_class_names[l - 2]].push(rules);
                        }
                    });
            }

            var date = new Date(),
                reference_date = (!plugin.settings.reference_date ? ($element.data('zdp_reference_date') && undefined !== $element.data('zdp_reference_date') ? $element.data('zdp_reference_date') : date) : plugin.settings.reference_date),
                tmp_start_date, tmp_end_date;
            start_date = undefined; end_date = undefined;
            first_selectable_month = reference_date.getMonth();
            current_system_month = date.getMonth();
            first_selectable_year = reference_date.getFullYear();
            current_system_year = date.getFullYear();
            first_selectable_day = reference_date.getDate();
            current_system_day = date.getDate();
            if (plugin.settings.direction === true) start_date = reference_date;
            else if (plugin.settings.direction === false) {
                end_date = reference_date;
                last_selectable_month = end_date.getMonth();
                last_selectable_year = end_date.getFullYear();
                last_selectable_day = end_date.getDate();

            }else if (
                (!$.isArray(plugin.settings.direction) && is_integer(plugin.settings.direction) && to_int(plugin.settings.direction) > 0) ||
                ($.isArray(plugin.settings.direction) && (
                    (tmp_start_date = check_date(plugin.settings.direction[0])) ||
                    plugin.settings.direction[0] === true ||
                    (is_integer(plugin.settings.direction[0]) && plugin.settings.direction[0] > 0)

                )&&(
                    (tmp_end_date = check_date(plugin.settings.direction[1])) ||
                    plugin.settings.direction[1] === false ||
                    (is_integer(plugin.settings.direction[1]) && plugin.settings.direction[1] >= 0)
                ))
            ){
                if (tmp_start_date) start_date = tmp_start_date;
                else
                    start_date = new Date(
                        first_selectable_year,
                        first_selectable_month,
                        first_selectable_day + (!$.isArray(plugin.settings.direction) ? to_int(plugin.settings.direction) : to_int(plugin.settings.direction[0] === true ? 0 : plugin.settings.direction[0]))
                    );
                first_selectable_month = start_date.getMonth();
                first_selectable_year = start_date.getFullYear();
                first_selectable_day = start_date.getDate();
                if (tmp_end_date && +tmp_end_date >= +start_date) end_date = tmp_end_date;

                    // if have information about the ending date
                else if (!tmp_end_date && plugin.settings.direction[1] !== false && $.isArray(plugin.settings.direction))
                    end_date = new Date(
                        first_selectable_year,
                        first_selectable_month,
                        first_selectable_day + to_int(plugin.settings.direction[1])
                    );
                if (end_date) {
                    last_selectable_month = end_date.getMonth();
                    last_selectable_year = end_date.getFullYear();
                    last_selectable_day = end_date.getDate();
                }
            }else if (
                (!$.isArray(plugin.settings.direction) && is_integer(plugin.settings.direction) && to_int(plugin.settings.direction) < 0) ||
                ($.isArray(plugin.settings.direction) && (
                    plugin.settings.direction[0] === false ||
                    (is_integer(plugin.settings.direction[0]) && plugin.settings.direction[0] < 0)
                ) && (
                    (tmp_start_date = check_date(plugin.settings.direction[1])) ||
                    (is_integer(plugin.settings.direction[1]) && plugin.settings.direction[1] >= 0)
                ))
            ) {
                end_date = new Date(
                    first_selectable_year,
                    first_selectable_month,
                    first_selectable_day + (!$.isArray(plugin.settings.direction) ? to_int(plugin.settings.direction) : to_int(plugin.settings.direction[0] === false ? 0 : plugin.settings.direction[0]))
                );
                last_selectable_month = end_date.getMonth();
                last_selectable_year = end_date.getFullYear();
                last_selectable_day = end_date.getDate();
				
                if (tmp_start_date && +tmp_start_date < +end_date) start_date = tmp_start_date;
                else if (!tmp_start_date && $.isArray(plugin.settings.direction))
                    start_date = new Date(
                        last_selectable_year,
                        last_selectable_month,
                        last_selectable_day - to_int(plugin.settings.direction[1])
                    );
                if (start_date) {
                    first_selectable_month = start_date.getMonth();
                    first_selectable_year = start_date.getFullYear();
                    first_selectable_day = start_date.getDate();
                }
            } else if ($.isArray(plugin.settings.disabled_dates) && plugin.settings.disabled_dates.length > 0)
                for (var interval in disabled_dates)
                    if (disabled_dates[interval][0] == '*' && disabled_dates[interval][1] == '*' && disabled_dates[interval][2] == '*' && disabled_dates[interval][3] == '*') {
                        var tmpDates = [];
                        $.each(enabled_dates, function() {
                            var rule = this;
                            if (rule[2][0] != '*')
                                tmpDates.push(parseInt(
                                    rule[2][0] +
                                    (rule[1][0] == '*' ? '12' : str_pad(rule[1][0], 2)) +
                                    (rule[0][0] == '*' ? (rule[1][0] == '*' ? '31' : new Date(rule[2][0], rule[1][0], 0).getDate()) : str_pad(rule[0][0], 2)), 10));

                        });
                        tmpDates.sort();

                        if (tmpDates.length > 0) {
                            var matches = (tmpDates[0] + '').match(/([0-9]{4})([0-9]{2})([0-9]{2})/);
                            first_selectable_year = parseInt(matches[1], 10);
                            first_selectable_month = parseInt(matches[2], 10) - 1;
                            first_selectable_day = parseInt(matches[3], 10);
                        }
                        break;
                    }
            if (is_disabled(first_selectable_year, first_selectable_month, first_selectable_day)) {
                while (is_disabled(first_selectable_year)) {
                    if (!start_date) {
                        first_selectable_year--;
                        first_selectable_month = 11;
                    } else {
                        first_selectable_year++;
                        first_selectable_month = 0;
                    }
                }
                while (is_disabled(first_selectable_year, first_selectable_month)) {
                    if (!start_date) {
                        first_selectable_month--;
                        first_selectable_day = new Date(first_selectable_year, first_selectable_month + 1, 0).getDate();
                    } else {
                        first_selectable_month++;
                        first_selectable_day = 1;
                    }

                    // if we moved to a following year
                    if (first_selectable_month > 11) {
                        first_selectable_year++;
                        first_selectable_month = 0;
                        first_selectable_day = 1;
                    } else if (first_selectable_month < 0) {
                        first_selectable_year--;
                        first_selectable_month = 11;
                        first_selectable_day = new Date(first_selectable_year, first_selectable_month + 1, 0).getDate();
                    }
                }

                // loop until we find the first selectable day
                while (is_disabled(first_selectable_year, first_selectable_month, first_selectable_day)) {
                    if (!start_date) first_selectable_day--;
                    else first_selectable_day++;
                    date = new Date(first_selectable_year, first_selectable_month, first_selectable_day);
                    first_selectable_year = date.getFullYear();
                    first_selectable_month = date.getMonth();
                    first_selectable_day = date.getDate();
                }
                date = new Date(first_selectable_year, first_selectable_month, first_selectable_day);
                first_selectable_year = date.getFullYear();
                first_selectable_month = date.getMonth();
                first_selectable_day = date.getDate();
            }
            var default_date = check_date($element.val() || (plugin.settings.start_date ? plugin.settings.start_date : ''));
            if (default_date && plugin.settings.strict && is_disabled(default_date.getFullYear(), default_date.getMonth(), default_date.getDate()))
                $element.val('');

            if (!update && (undefined !== start_date || undefined !== default_date))
                update_dependent(undefined !== default_date ? default_date : start_date);

            if (!plugin.settings.always_visible) {
                if (!update) {
                    if (plugin.settings.show_icon) {
                        if (browser.name == 'firefox' && $element.is('input[type="text"]') && $element.css('display') == 'inline') $element.css('display', 'inline-block');
                        var icon_wrapper = $('<span class="Zebra_DatePicker_Icon_Wrapper"></span>').css({
                            'display':  $element.css('display'),
                            'position': $element.css('position') == 'static' ? 'relative' : $element.css('position'),
                            'float':    $element.css('float'),
                            'top':      $element.css('top'),
                            'right':    $element.css('right'),
                            'bottom':   $element.css('bottom'),
                            'left':     $element.css('left'),
                            'z-index':  $element.css('1151 !important')
                        });
                        if ($element.css('display') == 'block') icon_wrapper.css('width', 'auto');
                        $element.wrap(icon_wrapper).css({
                            'position': 'relative',
                            'top':      'auto',
                            'right':    'auto',
                            'bottom':   'auto',
                            'left': 'auto',
                            'z-index':'1151 !important'
                    });
                    icon = $('<button type="button" class="Zebra_DatePicker_Icon' + ($element.attr('disabled') == 'disabled' ? ' Zebra_DatePicker_Icon_Disabled' : '') + '">Pick a date</button>');
                    plugin.icon = icon;
                    clickables = plugin.settings.open_icon_only ? icon : icon.add($element);
                } else clickables = $element;
                clickables.bind('click.Zebra_DatePicker_' + uniqueid, function(e) {
                    e.preventDefault();
                    if (!$element.attr('disabled'))
                        if (datepicker.hasClass('dp_visible')) plugin.hide();
                        else plugin.show();
                });
                if (!plugin.settings.readonly_element && plugin.settings.pair)
                    $element.bind('blur.Zebra_DatePicker_' + uniqueid, function() {
                        var date;
                        if ((date = check_date($(this).val())) && !is_disabled(date.getFullYear(), date.getMonth(), date.getDate())) update_dependent(date);

                    });
                if (undefined !== icon) icon.insertAfter($element);

            }
            if (undefined !== icon) {
                icon.attr('style', '');
                if (plugin.settings.inside) icon.addClass('Zebra_DatePicker_Icon_Inside_' + (plugin.settings.icon_position == 'right' ? 'Right' : 'Left'));

                var element_width = $element.outerWidth(),
                    element_height = $element.outerHeight(),
                    element_margin_left = parseInt($element.css('marginLeft'), 10) || 0,
                    element_margin_top = parseInt($element.css('marginTop'), 10) || 0,
						
                    icon_width = icon.outerWidth(),
                    icon_height = icon.outerHeight(),
                    icon_margin_left = parseInt(icon.css('marginLeft'), 10) || 0,
                    icon_margin_right = parseInt(icon.css('marginRight'), 10) || 0;
                if (plugin.settings.inside) {
                    icon.css('top', element_margin_top + ((element_height - icon_height) / 2));
                    if (plugin.settings.icon_position == 'right') icon.css('right', 0);
                    else icon.css('left', 0);
                } else
                    icon.css({
                        'top':  element_margin_top + ((element_height - icon_height) / 2),
                        'left': element_margin_left + element_width + icon_margin_left
                    });
                icon.removeClass(' Zebra_DatePicker_Icon_Disabled');
                if ($element.attr('disabled') == 'disabled') icon.addClass('Zebra_DatePicker_Icon_Disabled');
            }
        }

        show_select_today = (plugin.settings.show_select_today !== false && $.inArray('days', views) > -1 && !is_disabled(current_system_year, current_system_month, current_system_day) ? plugin.settings.show_select_today : false);
        if (update) {
            $('.dp_previous', datepicker).html(plugin.settings.header_navigation[0]);
            $('.dp_next', datepicker).html(plugin.settings.header_navigation[1]);
            $('.dp_clear', datepicker).html(plugin.settings.lang_clear_date);
            $('.dp_today', datepicker).html(plugin.settings.show_select_today);
            return;

        }
        $(window).bind('resize.Zebra_DatePicker_' + uniqueid + ', orientationchange.Zebra_DatePicker_' + uniqueid, function() {
            plugin.hide();
            if (icon !== undefined) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    plugin.update();

                }, 100);
            }
        });

        var html = '' +
            '<div class="Zebra_DatePicker">' +
                '<table class="dp_header">' +
                    '<tr>' +
                        '<td class="dp_previous">' + plugin.settings.header_navigation[0] + '</td>' +
                        '<td class="dp_caption">&#032;</td>' +
                        '<td class="dp_next">' + plugin.settings.header_navigation[1] + '</td>' +
                    '</tr>' +
                '</table>' +
                '<table class="dp_daypicker"></table>' +
                '<table class="dp_monthpicker"></table>' +
                '<table class="dp_yearpicker"></table>' +
                '<table class="dp_footer"><tr>' +
                    '<td class="dp_today"' + (plugin.settings.show_clear_date !== false ? ' style="width:50%"' : '') + '>' + show_select_today + '</td>' +
                    '<td class="dp_clear"' + (show_select_today !== false ? ' style="width:50%"' : '') + '>' + plugin.settings.lang_clear_date + '</td>' +
                '</tr></table>' +
            '</div>';

        datepicker = $(html);
        plugin.datepicker = datepicker;

        header = $('table.dp_header', datepicker);
        daypicker = $('table.dp_daypicker', datepicker);
        monthpicker = $('table.dp_monthpicker', datepicker);
        yearpicker = $('table.dp_yearpicker', datepicker);
        footer = $('table.dp_footer', datepicker);
        selecttoday = $('td.dp_today', footer);
        cleardate = $('td.dp_clear', footer);

        if (!plugin.settings.always_visible)
            plugin.settings.container.append(datepicker);
        else if (!$element.attr('disabled')) {
            plugin.settings.always_visible.append(datepicker);
            plugin.show();
        }
        datepicker.
            delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)', 'mouseover', function() {
                $(this).addClass('dp_hover');
            }).
            delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)', 'mouseout', function() {
                $(this).removeClass('dp_hover');
            });
        disable_text_select($('td', header));
        $('.dp_previous', header).bind('click', function() {
            if (view == 'months') selected_year--;
            else if (view == 'years') selected_year -= 12;
            else if (--selected_month < 0) {
                selected_month = 11;
                selected_year--;
            }
            manage_views();
        });
			
        $('.dp_caption', header).bind('click', function() {
            if (view == 'days') view = ($.inArray('months', views) > -1 ? 'months' : ($.inArray('years', views) > -1 ? 'years' : 'days'));
            else if (view == 'months') view = ($.inArray('years', views) > -1 ? 'years' : ($.inArray('days', views) > -1 ? 'days' : 'months'));
            else view = ($.inArray('days', views) > -1 ? 'days' : ($.inArray('months', views) > -1 ? 'months' : 'years'));
            manage_views();

        });

        $('.dp_next', header).bind('click', function() {
            if (view == 'months') selected_year++;
            else if (view == 'years') selected_year += 12;
            else if (++selected_month == 12) {
                selected_month = 0;
                selected_year++;
            }
            manage_views();
        });

        daypicker.delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)', 'click', function() {
            if (plugin.settings.select_other_months && $(this).attr('class') && null !== (matches = $(this).attr('class').match(/date\_([0-9]{4})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])/)))
                select_date(matches[1], matches[2] - 1, matches[3], 'days', $(this));
            else select_date(selected_year, selected_month, to_int($(this).html()), 'days', $(this));
        });
			
        monthpicker.delegate('td:not(.dp_disabled)', 'click', function() {
            var matches = $(this).attr('class').match(/dp\_month\_([0-9]+)/);
            selected_month = to_int(matches[1]);
            if ($.inArray('days', views) == -1)
                select_date(selected_year, selected_month, 1, 'months', $(this));
            else {
                view = 'days';
                if (plugin.settings.always_visible) $element.val('');
                manage_views();
            }
        });

        yearpicker.delegate('td:not(.dp_disabled)', 'click', function() {
            selected_year = to_int($(this).html());
            if ($.inArray('months', views) == -1)
                select_date(selected_year, 1, 1, 'years', $(this));
            else {
                view = 'months';
                if (plugin.settings.always_visible) $element.val('');
                manage_views();
            }
        });

        $(selecttoday).bind('click', function(e) {
            e.preventDefault();
            select_date(current_system_year, current_system_month, current_system_day, 'days', $('.dp_current', daypicker));
            if (plugin.settings.always_visible)
                plugin.show();
            plugin.hide();
        });

        $(cleardate).bind('click', function(e) {
            e.preventDefault();
            $element.val('');
            if (!plugin.settings.always_visible) {
                default_day = null; default_month = null; default_year = null; selected_month = null; selected_year = null;
            } else {
                default_day = null; default_month = null; default_year = null;
                $('td.dp_selected', datepicker).removeClass('dp_selected');
            }
            plugin.hide();
            if (plugin.settings.onClear && typeof plugin.settings.onClear == 'function')
                plugin.settings.onClear.call($element, $element);
        });
        if (!plugin.settings.always_visible) {
            $(document).bind('mousedown.Zebra_DatePicker_' + uniqueid + ', touchstart.Zebra_DatePicker_' + uniqueid, function(e) {
                if (datepicker.hasClass('dp_visible')) {
                    if (plugin.settings.show_icon && $(e.target).get(0) === icon.get(0)) return true;
                    if ($(e.target).parents().filter('.Zebra_DatePicker').length === 0) plugin.hide();
                }
            });
            $(document).bind('keyup.Zebra_DatePicker_' + uniqueid, function(e) {
                if (datepicker.hasClass('dp_visible') && e.which == 27) plugin.hide();

            });

        }
        manage_views();
    };

    plugin.clear_date = function() {
        $(cleardate).trigger('click');
    };
    plugin.destroy = function() {
        if (undefined !== plugin.icon) plugin.icon.remove();
        plugin.datepicker.remove();
        if (plugin.settings.show_icon && !plugin.settings.always_visible) $element.unwrap();
        $element.unbind('click.Zebra_DatePicker_' + uniqueid);
        $element.unbind('blur.Zebra_DatePicker_' + uniqueid);
        $(document).unbind('keyup.Zebra_DatePicker_' + uniqueid);
        $(document).unbind('mousedown.Zebra_DatePicker_' + uniqueid);
        $(window).unbind('resize.Zebra_DatePicker_' + uniqueid);
        $(window).unbind('orientationchange.Zebra_DatePicker_' + uniqueid);
        $element.removeData('Zebra_DatePicker');
        $element.attr('readonly', original_attributes['readonly'] ? true : false);
        $element.attr('style', original_attributes['style'] ? original_attributes['style'] : '');

    };
    plugin.hide = function() {
        if (!plugin.settings.always_visible) {
            iframeShim('hide');
            datepicker.removeClass('dp_visible').addClass('dp_hidden');
            if (plugin.settings.onClose && typeof plugin.settings.onClose == 'function')
                plugin.settings.onClose.call($element, $element);
        }
    };

    plugin.set_date = function(date) {
        var dateObj;
        if ((dateObj = check_date(date)) && !is_disabled(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())) {
            $element.val(date);
            update_dependent(dateObj);
        }
    };

    plugin.show = function() {
        view = plugin.settings.view;
        var default_date = check_date($element.val() || (plugin.settings.start_date ? plugin.settings.start_date : ''));
        if (default_date) {
            default_month = default_date.getMonth();
            selected_month = default_date.getMonth();
            default_year = default_date.getFullYear();
            selected_year = default_date.getFullYear();
            default_day = default_date.getDate();
				
            if (is_disabled(default_year, default_month, default_day)) {
                if (plugin.settings.strict) $element.val('');
                selected_month = first_selectable_month;
                selected_year = first_selectable_year;
            }
        } else {
            selected_month = first_selectable_month;
            selected_year = first_selectable_year;
        }
        manage_views();
        if (!plugin.settings.always_visible) {
            if (plugin.settings.container.is('body')) {
                var datepicker_width = datepicker.outerWidth(),
                    datepicker_height = datepicker.outerHeight(),
                    left = (undefined !== icon ? icon.offset().left + icon.outerWidth(true) : $element.offset().left + $element.outerWidth(true)) + plugin.settings.offset[0],
                    top = (undefined !== icon ? icon.offset().top : $element.offset().top) - datepicker_height + plugin.settings.offset[1],

                    // get browser window's width and height
                    window_width = $(window).width(),
                    window_height = $(window).height(),
                    window_scroll_top = $(window).scrollTop(),
                    window_scroll_left = $(window).scrollLeft();
                if (plugin.settings.default_position == 'below')
                    top = (undefined !== icon ? icon.offset().top : $element.offset().top) + plugin.settings.offset[1];
                if (left + datepicker_width > window_scroll_left + window_width) left = window_scroll_left + window_width - datepicker_width;
                if (left < window_scroll_left) left = window_scroll_left;

                if (top + datepicker_height > window_scroll_top + window_height) top = window_scroll_top + window_height - datepicker_height;
                if (top < window_scroll_top) top = window_scroll_top;
                datepicker.css({
                    'left': left,
                    'top':  top
                });
            } else
                datepicker.css({
                    'left': 0,
                    'top':  0
                });
            datepicker.removeClass('dp_hidden').addClass('dp_visible');
            iframeShim();
        } else datepicker.removeClass('dp_hidden').addClass('dp_visible');
        if (plugin.settings.onOpen && typeof plugin.settings.onOpen == 'function')
            plugin.settings.onOpen.call($element, $element);

    };
    plugin.update = function(values) {
        if (plugin.original_direction) plugin.original_direction = plugin.direction;
        plugin.settings = $.extend(plugin.settings, values);
        init(true);
    };

    var check_date = function(str_date) {
        str_date += '';
        if ($.trim(str_date) !== '') {
            var format = escape_regexp(plugin.settings.format),
                format_chars = ['d','D','j','l','N','S','w','F','m','M','n','Y','y'],
                matches = [],
                regexp = [],
                position = null,
                segments = null;
            for (var i = 0; i < format_chars.length; i++)
                if ((position = format.indexOf(format_chars[i])) > -1)
                    matches.push({character: format_chars[i], position: position});
            matches.sort(function(a, b){ return a.position - b.position; });
            $.each(matches, function(index, match) {
                switch (match.character) {
                    case 'd': regexp.push('0[1-9]|[12][0-9]|3[01]'); break;
                    case 'D': regexp.push('[a-z]{3}'); break;
                    case 'j': regexp.push('[1-9]|[12][0-9]|3[01]'); break;
                    case 'l': regexp.push('[a-z]+'); break;
                    case 'N': regexp.push('[1-7]'); break;
                    case 'S': regexp.push('st|nd|rd|th'); break;
                    case 'w': regexp.push('[0-6]'); break;
                    case 'F': regexp.push('[a-z]+'); break;
                    case 'm': regexp.push('0[1-9]|1[012]+'); break;
                    case 'M': regexp.push('[a-z]{3}'); break;
                    case 'n': regexp.push('[1-9]|1[012]'); break;
                    case 'Y': regexp.push('[0-9]{4}'); break;
                    case 'y': regexp.push('[0-9]{2}'); break;
                }
            });
            if (regexp.length) {
                matches.reverse();
                $.each(matches, function(index, match) {
                    format = format.replace(match.character, '(' + regexp[regexp.length - index - 1] + ')');
                });
                regexp = new RegExp('^' + format + '$', 'ig');
                if ((segments = regexp.exec(str_date))) {
                    var tmpdate = new Date(),
                        original_day = 1,
                        original_month = tmpdate.getMonth() + 1,
                        original_year = tmpdate.getFullYear(),
                        english_days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                        english_months = ['January','February','March','April','May','June','July','August','September','October','November','December'],
                        iterable,
                    valid = true;
                    matches.reverse();
                    $.each(matches, function(index, match) {
                        if (!valid) return true;
                        switch (match.character) {

                            case 'm':
                            case 'n':
                                original_month = to_int(segments[index + 1]);
                                break;
                            case 'd':
                            case 'j':
                                original_day = to_int(segments[index + 1]);
                                break;
                            case 'D':
                            case 'l':
                            case 'F':
                            case 'M':
                                if (match.character == 'D' || match.character == 'l') iterable = plugin.settings.days;
                                else iterable = plugin.settings.months;
                                valid = false;
                                $.each(iterable, function(key, value) {
                                    if (valid) return true;
                                    if (segments[index + 1].toLowerCase() == value.substring(0, (match.character == 'D' || match.character == 'M' ? 3 : value.length)).toLowerCase()) {
                                        switch (match.character) {
                                            case 'D': segments[index + 1] = english_days[key].substring(0, 3); break;
                                            case 'l': segments[index + 1] = english_days[key]; break;
                                            case 'F': segments[index + 1] = english_months[key]; original_month = key + 1; break;
                                            case 'M': segments[index + 1] = english_months[key].substring(0, 3); original_month = key + 1; break;
                                        }
                                        valid = true;
                                    }
                                });
                                break;
                            case 'Y':
                                original_year = to_int(segments[index + 1]);
                                break;
                            case 'y':
                                original_year = '19' + to_int(segments[index + 1]);
                                break;
                        }
                    });
                    if (valid) {
                        var date = new Date(original_year, (original_month || 1) - 1, original_day || 1);
                        if (date.getFullYear() == original_year && date.getDate() == (original_day || 1) && date.getMonth() == ((original_month || 1) - 1))
                            return date;
                    }
                }
            }
            return false;
        }
    };

    var disable_text_select = function(el) {
        if (browser.name == 'firefox') el.css('MozUserSelect', 'none');
        else if (browser.name == 'explorer') el.bind('selectstart', function() { return false; });
        else el.mousedown(function() { return false; });
    };
		
    var escape_regexp = function(str) {
        return str.replace(/([-.,*+?^${}()|[\]\/\\])/g, '\\$1');
    };

    var format = function(date) {
        var result = '',
            j = date.getDate(),
            w = date.getDay(),
            l = plugin.settings.days[w],
            n = date.getMonth() + 1,
            f = plugin.settings.months[n - 1],
            y = date.getFullYear() + '';

        // iterate through the characters in the format
        for (var i = 0; i < plugin.settings.format.length; i++) {
            var chr = plugin.settings.format.charAt(i);
            switch(chr) {
                case 'y': y = y.substr(2);
                case 'Y': result += y; break;
                case 'm': n = str_pad(n, 2);
                case 'n': result += n; break;
                case 'M': f = ($.isArray(plugin.settings.months_abbr) && undefined !== plugin.settings.months_abbr[n - 1] ? plugin.settings.months_abbr[n - 1] : plugin.settings.months[n - 1].substr(0, 3));
                case 'F': result += f; break;
                case 'd': j = str_pad(j, 2);
                case 'j': result += j; break;
                case 'D': l = ($.isArray(plugin.settings.days_abbr) && undefined !== plugin.settings.days_abbr[w] ? plugin.settings.days_abbr[w] : plugin.settings.days[w].substr(0, 3));
                case 'l': result += l; break;
                case 'N': w++;
                case 'w': result += w; break;
                case 'S':
                    if (j % 10 == 1 && j != '11') result += 'st';

                    else if (j % 10 == 2 && j != '12') result += 'nd';

                    else if (j % 10 == 3 && j != '13') result += 'rd';

                    else result += 'th';

                    break;
                default: result += chr;
            }
        }
        return result;
    };
    var generate_daypicker = function() {
        var days_in_month = new Date(selected_year, selected_month + 1, 0).getDate(),
            first_day = new Date(selected_year, selected_month, 1).getDay(),
            days_in_previous_month = new Date(selected_year, selected_month, 0).getDate(),

        // how many days are there to be shown from the previous month
        days_from_previous_month = first_day - plugin.settings.first_day_of_week;
        days_from_previous_month = days_from_previous_month < 0 ? 7 + days_from_previous_month : days_from_previous_month;
        manage_header(plugin.settings.header_captions['days']);
        var html = '<tr>';
        if (plugin.settings.show_week_number)
            html += '<th>' + plugin.settings.show_week_number + '</th>';
        for (var i = 0; i < 7; i++)
            html += '<th>' + ($.isArray(plugin.settings.days_abbr) && undefined !== plugin.settings.days_abbr[(plugin.settings.first_day_of_week + i) % 7] ? plugin.settings.days_abbr[(plugin.settings.first_day_of_week + i) % 7] : plugin.settings.days[(plugin.settings.first_day_of_week + i) % 7].substr(0, 2)) + '</th>';
        html += '</tr><tr>';
        for (i = 0; i < 42; i++) {
            // seven days per row
            if (i > 0 && i % 7 === 0) html += '</tr><tr>';
            if (i % 7 === 0 && plugin.settings.show_week_number)
                html += '<td class="dp_week_number">' + getWeekNumber(new Date(selected_year, selected_month, (i - days_from_previous_month + 1))) + '</td>';
            var day = (i - days_from_previous_month + 1);
            if (plugin.settings.select_other_months && (i < days_from_previous_month || day > days_in_month)) {
                var real_date = new Date(selected_year, selected_month, day),
                    real_year = real_date.getFullYear(),
                    real_month = real_date.getMonth(),
                    real_day = real_date.getDate();
                // extract normalized date parts and merge them
                real_date =  real_year + str_pad(real_month + 1, 2) + str_pad(real_day, 2);
            }
            // if this is a day from the previous month
            if (i < days_from_previous_month)
                html += '<td class="' + (plugin.settings.select_other_months && !is_disabled(real_year, real_month, real_day) ? 'dp_not_in_month_selectable date_' + real_date : 'dp_not_in_month') + '">' + (plugin.settings.select_other_months || plugin.settings.show_other_months ? str_pad(days_in_previous_month - days_from_previous_month + i + 1, plugin.settings.zero_pad ? 2 : 0) : '&nbsp;') + '</td>';
            else if (day > days_in_month)
                html += '<td class="' + (plugin.settings.select_other_months && !is_disabled(real_year, real_month, real_day) ? 'dp_not_in_month_selectable date_' + real_date : 'dp_not_in_month') + '">' + (plugin.settings.select_other_months || plugin.settings.show_other_months ? str_pad(day - days_in_month, plugin.settings.zero_pad ? 2 : 0) : '&nbsp;') + '</td>';
                // if this is a day from the current month
            else {
                var weekday = (plugin.settings.first_day_of_week + i) % 7,
                    class_name = '',
                    custom_class_name = get_custom_class(selected_year, selected_month, day);
                // if date needs to be disabled
                if (is_disabled(selected_year, selected_month, day)) {
                    if ($.inArray(weekday, plugin.settings.weekend_days) > -1) class_name = 'dp_weekend_disabled';
                    else class_name += ' dp_disabled';
                    if (selected_month == current_system_month && selected_year == current_system_year && current_system_day == day) class_name += ' dp_disabled_current';
                    if (custom_class_name != '') class_name += ' ' + custom_class_name + '_disabled';
                } else {
                    if ($.inArray(weekday, plugin.settings.weekend_days) > -1) class_name = 'dp_weekend';
                    if (selected_month == default_month && selected_year == default_year && default_day == day) class_name += ' dp_selected';
                    if (selected_month == current_system_month && selected_year == current_system_year && current_system_day == day) class_name += ' dp_current';
                    if (custom_class_name != '') class_name += ' ' + custom_class_name;
                }
                html += '<td' + (class_name !== '' ? ' class="' + $.trim(class_name) + '"' : '') + '>' + ((plugin.settings.zero_pad ? str_pad(day, 2) : day) || '&nbsp;') + '</td>';
            }

        }
        html += '</tr>';
        daypicker.html($(html));
        if (plugin.settings.always_visible)
            daypicker_cells = $('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)', daypicker);
        daypicker.show();

    };
    var generate_monthpicker = function() {
        manage_header(plugin.settings.header_captions['months']);
        var html = '<tr>';
        for (var i = 0; i < 12; i++) {
            if (i > 0 && i % 3 === 0) html += '</tr><tr>';
            var class_name = 'dp_month_' + i;
            if (is_disabled(selected_year, i)) class_name += ' dp_disabled';
            else if (default_month !== false && default_month == i && selected_year == default_year) class_name += ' dp_selected';
            else if (current_system_month == i && current_system_year == selected_year) class_name += ' dp_current';
            html += '<td class="' + $.trim(class_name) + '">' + ($.isArray(plugin.settings.months_abbr) && undefined !== plugin.settings.months_abbr[i] ? plugin.settings.months_abbr[i] : plugin.settings.months[i].substr(0, 3)) + '</td>';

        }
        html += '</tr>';
        monthpicker.html($(html));
        if (plugin.settings.always_visible)
            monthpicker_cells = $('td:not(.dp_disabled)', monthpicker);
        monthpicker.show();

    };
    var generate_yearpicker = function() {
        manage_header(plugin.settings.header_captions['years']);
        var html = '<tr>';
        for (var i = 0; i < 12; i++) {
            if (i > 0 && i % 3 === 0) html += '</tr><tr>';
            var class_name = '';
            // if year needs to be disabled
            if (is_disabled(selected_year - 7 + i)) class_name += ' dp_disabled';
            else if (default_year && default_year == selected_year - 7 + i) class_name += ' dp_selected';
            else if (current_system_year == (selected_year - 7 + i)) class_name += ' dp_current';
            html += '<td' + ($.trim(class_name) !== '' ? ' class="' + $.trim(class_name) + '"' : '') + '>' + (selected_year - 7 + i) + '</td>';
        }
        html += '</tr>';
        yearpicker.html($(html));
        if (plugin.settings.always_visible)
            yearpicker_cells = $('td:not(.dp_disabled)', yearpicker);
        yearpicker.show();
    };
    var get_custom_class = function(year, month, day) {
        var class_name, i, found;
        if (typeof month != 'undefined') month = month + 1;
        for (i in custom_class_names) {
            class_name = custom_class_names[i]; found = false;
            if ($.isArray(custom_classes[class_name]))
                $.each(custom_classes[class_name], function() {
                    if (found) return;
                    var rule = this;
                    if ($.inArray(year, rule[2]) > -1 || $.inArray('*', rule[2]) > -1)
                        if ((typeof month != 'undefined' && $.inArray(month, rule[1]) > -1) || $.inArray('*', rule[1]) > -1)
                            if ((typeof day != 'undefined' && $.inArray(day, rule[0]) > -1) || $.inArray('*', rule[0]) > -1) {
                                if (rule[3] == '*') return (found = class_name);
                                var weekday = new Date(year, month - 1, day).getDay();
                                if ($.inArray(weekday, rule[3]) > -1) return (found = class_name);
    
                            }
                });
            if (found) return found;

        }
        return found || '';
    };
    var iframeShim = function(action) {
        if (browser.name == 'explorer' && browser.version == 6) {
            if (!shim) {
                var zIndex = to_int(datepicker.css('zIndex')) - 1;
                shim = $('<iframe>', {
                    'src':                  'javascript:document.write("")',
                    'scrolling':            'no',
                    'frameborder':          0,
                    css: {
                        'zIndex':       zIndex,
                        'position':     'absolute',
                        'top':          -1000,
                        'left':         -1000,
                        'width':        datepicker.outerWidth(),
                        'height':       datepicker.outerHeight(),
                        'filter':       'progid:DXImageTransform.Microsoft.Alpha(opacity=0)',
                        'display':      'none'
                    }
                });
                $('body').append(shim);
            }
            switch (action) {
                case 'hide':
                    shim.hide();
                    break;
                default:
                    var offset = datepicker.offset();
                    shim.css({
                        'top':      offset.top,
                        'left':     offset.left,
                        'display':  'block'
                    });
            }
        }
    };
    var is_disabled = function(year, month, day) {
        if ((undefined === year || isNaN(year)) && (undefined === month || isNaN(month)) && (undefined === day || isNaN(day))) return false;
        else if (year < 1000) return true;
        if (!(!$.isArray(plugin.settings.direction) && to_int(plugin.settings.direction) === 0)) {
            var
                now = to_int(str_concat(year, (typeof month != 'undefined' ? str_pad(month, 2) : ''), (typeof day != 'undefined' ? str_pad(day, 2) : ''))),
            len = (now + '').length;
            if (len == 8 && (
                (typeof start_date != 'undefined' && now < to_int(str_concat(first_selectable_year, str_pad(first_selectable_month, 2), str_pad(first_selectable_day, 2)))) ||
                (typeof end_date != 'undefined' && now > to_int(str_concat(last_selectable_year, str_pad(last_selectable_month, 2), str_pad(last_selectable_day, 2))))
            )) return true;
            else if (len == 6 && (
                (typeof start_date != 'undefined' && now < to_int(str_concat(first_selectable_year, str_pad(first_selectable_month, 2)))) ||
                (typeof end_date != 'undefined' && now > to_int(str_concat(last_selectable_year, str_pad(last_selectable_month, 2))))
            )) return true;
            else if (len == 4 && (
                (typeof start_date != 'undefined' && now < first_selectable_year) ||
                (typeof end_date != 'undefined'  && now > last_selectable_year)
            )) return true;
        }
        if (typeof month != 'undefined') month = month + 1;
        var disabled = false, enabled = false;
        if ($.isArray(disabled_dates) && disabled_dates.length)
            $.each(disabled_dates, function() {
                if (disabled) return;
                var rule = this;
                if ($.inArray(year, rule[2]) > -1 || $.inArray('*', rule[2]) > -1)
                    if ((typeof month != 'undefined' && $.inArray(month, rule[1]) > -1) || $.inArray('*', rule[1]) > -1)
                        if ((typeof day != 'undefined' && $.inArray(day, rule[0]) > -1) || $.inArray('*', rule[0]) > -1) {
                            if (rule[3] == '*') return (disabled = true);
                            var weekday = new Date(year, month - 1, day).getDay();
                            if ($.inArray(weekday, rule[3]) > -1) return (disabled = true);
                        }
            });
        if (enabled_dates)
            $.each(enabled_dates, function() {
                if (enabled) return;
                var rule = this;
                if ($.inArray(year, rule[2]) > -1 || $.inArray('*', rule[2]) > -1) {
                    enabled = true;
                    if (typeof month != 'undefined') {
                        enabled = true;
                        if ($.inArray(month, rule[1]) > -1 || $.inArray('*', rule[1]) > -1) {
                            if (typeof day != 'undefined') {
                                enabled = true;
                                if ($.inArray(day, rule[0]) > -1 || $.inArray('*', rule[0]) > -1) {
                                    if (rule[3] == '*') return (enabled = true);
                                    var weekday = new Date(year, month - 1, day).getDay();
                                    if ($.inArray(weekday, rule[3]) > -1) return (enabled = true);
                                    enabled = false;
                                } else enabled = false;
                            }
                        } else enabled = false;
                    }
                }
            });
        if (enabled_dates && enabled) return false;
        else if (disabled_dates && disabled) return true;
        return false;

    };
    var is_integer = function(value) {
        return (value + '').match(/^\-?[0-9]+$/) ? true : false;
    };
    var manage_header = function(caption) {
        if (!isNaN(parseFloat(selected_month)) && isFinite(selected_month))
            caption = caption.replace(/\bm\b|\bn\b|\bF\b|\bM\b/, function (match) {
                switch (match) {
                    case 'm':
                        return str_pad(selected_month + 1, 2);
                    case 'n':
                        return selected_month + 1;
                    case 'F':
                        return plugin.settings.months[selected_month];
                    case 'M':
                        return ($.isArray(plugin.settings.months_abbr) && undefined !== plugin.settings.months_abbr[selected_month] ? plugin.settings.months_abbr[selected_month] : plugin.settings.months[selected_month].substr(0, 3));
                    default:
                        return match;
                }
            });
        if (!isNaN(parseFloat(selected_year)) && isFinite(selected_year))
            // replace year-related patterns
            caption =
                caption.
                replace(/\bY\b/, selected_year).
                replace(/\by\b/, (selected_year + '').substr(2)).
                replace(/\bY1\b/i, selected_year - 7).
                replace(/\bY2\b/i, selected_year + 4);
        $('.dp_caption', header).html(caption);
    };
    var manage_views = function() {
        if (daypicker.text() === '' || view == 'days') {
            if (daypicker.text() === '') {
                if (!plugin.settings.always_visible)
                    datepicker.css('left', -1000);
                datepicker.css('visibility', 'visible');

                // generate the day picker
                generate_daypicker();
                var width = daypicker.outerWidth(),
                    height = daypicker.outerHeight();
                monthpicker.css({
                    'width':    width,
                    'height':   height
                });
                yearpicker.css({
                    'width':    width,
                    'height':   height
                });
                header.css('width', width);
                footer.css('width', width);
                datepicker.css('visibility', '').addClass('dp_hidden');
            } else generate_daypicker();
            monthpicker.hide();
            yearpicker.hide();
            // if the view is "months"
        } else if (view == 'months') {
            // generate the month picker
            generate_monthpicker();
            // hide the day and the year pickers
            daypicker.hide();
            yearpicker.hide();
            // if the view is "years"
        } else if (view == 'years') {
            generate_yearpicker();
            daypicker.hide();
            monthpicker.hide();
        }
        // if a callback function exists for when navigating through months/years
        if (plugin.settings.onChange && typeof plugin.settings.onChange == 'function' && undefined !== view) {
            var elements = (view == 'days' ?
                                daypicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)') :
                                    (view == 'months' ?
                                        monthpicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)') :
                                            yearpicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)')));
            elements.each(function() {
                var matches;
                if (view == 'days') {
                    if ($(this).hasClass('dp_not_in_month_selectable')) {
                        matches = $(this).attr('class').match(/date\_([0-9]{4})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])/);
                        $(this).data('date', matches[1] + '-' + matches[2] + '-' + matches[3]);
                    } else
                        $(this).data('date', selected_year + '-' + str_pad(selected_month + 1, 2) + '-' + str_pad(to_int($(this).text()), 2));
                    // if view is "months"
                } else if (view == 'months') {
                    matches = $(this).attr('class').match(/dp\_month\_([0-9]+)/);
                    $(this).data('date', selected_year + '-' + str_pad(to_int(matches[1]) + 1, 2));
                } else
                    $(this).data('date', to_int($(this).text()));
            });
            plugin.settings.onChange.call($element, view, elements, $element);

        }
        footer.show();
        if (
            plugin.settings.show_clear_date === true ||
            (plugin.settings.show_clear_date === 0 && $element.val() !== '') ||
            (plugin.settings.always_visible && plugin.settings.show_clear_date !== false)
        ) {
            cleardate.show();
            if (show_select_today) {
                selecttoday.css('width', '50%');
                cleardate.css('width', '50%');
            } else {
                selecttoday.hide();
                cleardate.css('width', '100%');
            }
        } else {
            cleardate.hide();
            if (show_select_today) selecttoday.show().css('width', '100%');
            else footer.hide();
        }
    };
    var select_date = function(year, month, day, view, cell) {
        var
            default_date = new Date(year, month, day, 12, 0, 0),
            view_cells = (view == 'days' ? daypicker_cells : (view == 'months' ? monthpicker_cells : yearpicker_cells)),
            selected_value = format(default_date);
				
        // set the currently selected and formated date as the value of the element the plugin is attached to
        $element.val(selected_value);
        // if date picker is always visible
        if (plugin.settings.always_visible) {
            default_month = default_date.getMonth();
            selected_month = default_date.getMonth();
            default_year = default_date.getFullYear();
            selected_year = default_date.getFullYear();
            default_day = default_date.getDate();
            view_cells.removeClass('dp_selected');
            cell.addClass('dp_selected');
            if (view == 'days' && cell.hasClass('dp_not_in_month_selectable')) plugin.show();
        }
        plugin.hide();
        update_dependent(default_date);
        if (plugin.settings.onSelect && typeof plugin.settings.onSelect == 'function')
            plugin.settings.onSelect.call($element, selected_value, year + '-' + str_pad(month + 1, 2) + '-' + str_pad(day, 2), default_date, $element, getWeekNumber(default_date));
        $element.focus();

    };
    var str_concat = function() {
        var str = '';
        for (var i = 0; i < arguments.length; i++) str += (arguments[i] + '');
        return str;
    };
    var str_pad = function(str, len) {
        str += '';
        while (str.length < len) str = '0' + str;
        return str;
    };
    var to_int = function(str) {
        return parseInt(str, 10);
    };
    var update_dependent = function(date) {
        if (plugin.settings.pair) {
            $.each(plugin.settings.pair, function() {
                var $pair = $(this);
                if (!($pair.data && $pair.data('Zebra_DatePicker')))
                    $pair.data('zdp_reference_date', date);
                else {
                    var dp = $pair.data('Zebra_DatePicker');
                    dp.update({
                        'reference_date':date,
                        'direction':dp.settings.direction === 0 ? 1 : dp.settings.direction
                    });
                     
                    if (dp.settings.always_visible) dp.show();
                }

            });
        }
    };
    var getWeekNumber = function(date) {

        var y = date.getFullYear(),
            m = date.getMonth() + 1,
            d = date.getDate(),
            a, b, c, s, e, f, g, n, w;
        if (m < 3) {

            a = y - 1;
            b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
            c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
            s = b - c;
            e = 0;
            f = d - 1 + 31 * (m - 1);
        } else {

            a = y;
            b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
            c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
            s = b - c;
            e = s + 1;
            f = d + ((153 * (m - 3) + 2) / 5 | 0) + 58 + s;

        }

        g = (a + b) % 7;
        d = (f + g - e) % 7;
        n = f + 3 - d;

        if (n < 0) w = 53 - ((g - s) / 5 | 0);

        else if (n > 364 + s) w = 1;

        else w = (n / 7 | 0) + 1;
        return w;
    };

    var browser = {
        init: function () {
            this.name = this.searchString(this.dataBrowser) || '';
            this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || '';
        },
        searchString: function (data) {
            for (var i=0;i<data.length;i++) {
                var dataString = data[i].string;
                var dataProp = data[i].prop;
                this.versionSearchString = data[i].versionSearch || data[i].identity;
                if (dataString) {
                    if (dataString.indexOf(data[i].subString) != -1)
                        return data[i].identity;
                }
                else if (dataProp)
                    return data[i].identity;
            }
        },
        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index == -1) return;
            return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
        },
        dataBrowser: [
            {
                string: navigator.userAgent,
                subString: 'Firefox',
                identity: 'firefox'
            },
            {
                string: navigator.userAgent,
                subString: 'MSIE',
                identity: 'explorer',
                versionSearch: 'MSIE'
            }
        ]
    };
    browser.init();
    init();
};

$.fn.Zebra_DatePicker = function(options) {
    return this.each(function() {
        if (undefined !== $(this).data('Zebra_DatePicker'))
            $(this).data('Zebra_DatePicker').destroy();
        var plugin = new $.Zebra_DatePicker(this, options);
        $(this).data('Zebra_DatePicker', plugin);
    });
};
}));
