	// Keep Dropdowns open for multiselect.
		$('li[name="filterDropdown"] .dropdown-menu').on({
		"click":function(e){
		  e.stopPropagation();
		}
	});
	// Listen for click on toggle checkbox
		$('input[name=select-all]').click(function(event) {
			var selectallvalue = this.value;
			if(this.checked) {
				// Iterate each checkbox
				$('input[name= ' + selectallvalue + ']').each(function() {
					this.checked = true;					
				});
			}
			 else {
				$('input[name= ' + selectallvalue + ']').each(function() {
					this.checked = false;
				});
			  }
		});
		// Interpret URL parameters
		function GetQueryStringParams(sParam)
		{
			var sPageURL = window.location.search.substring(1);
			var sURLVariables = sPageURL.split('&');
			var sParams = [];
			for (var i = 0; i < sURLVariables.length; i++)
			{
				var sParameterName = sURLVariables[i].split('=');
				//console.log(sParameterName);
				if (sParameterName[0] === sParam){
					sParams.push(sParameterName[1].replace("%20"," "));
				}		
			};
			if (sParams.length === 0) {return};
			//Uncheck 'select-all' checkbox if param available
			$('input[id=select-all-' + sParam + ']').each(function() {
				this.checked = false;
			});
			// Iterate each checkbox & uncheck, e.g. all ward checkboxes
			//alert(sParams.indexOf("Forest Hill"));
			//console.log(sParams);
			$('input[name= ' + sParam + ']').each(function() {
				var inputId = this.id;
				if (sParams.indexOf(inputId) > -1){
					this.checked = true;
				}
				else
				{
				this.checked = false;
				};
			});
			var QueryString = sParam + " in ('" + sParams.join("','") + "')";
			QueryString = QueryString.replace("Not Recorded","");
			return QueryString;
		};
		window.onload = function() {
			var attr = ["ward","genus","age","condition","category"];
			var QueryStrings = [];
			$.each(attr, function(i,value) {
				var QueryString = GetQueryStringParams(value);
				if (QueryString != undefined) {
					QueryStrings.push(QueryString);
					console.log(QueryStrings)
				}
			});
			var tableName = "lewisham_tree_map";
			//console.log(typeof QueryStrings);
			console.log(QueryStrings.length);
			console.log(!QueryStrings);
			if (QueryStrings.length > 0) {
				var sqlString1 = "select * from " + tableName + " where " + QueryStrings.join(" and ");
				var sqlString2 = "with genus_label as (select distinct genus from " + tableName +  "), " +
												 "tree_count as (select genus, count(*) from " + tableName + " " +
												 "where " + QueryStrings.join(" and ") +
												 " group by genus) " +
												 "select genus_label.genus, " +
												 "CASE WHEN tree_count.count is null THEN 0 ELSE tree_count.count END " +
												 "FROM genus_label " +
												 "left outer join tree_count " +
												 "on genus_label.genus = tree_count.genus ";
			} else {
				var sqlString1 = "select * from " + tableName;
				var sqlString2 = "select genus, count(*) FROM "+ tableName +" where ward is not null group by genus";
			}
			console.log(sqlString2);
            // var tableName = "all_day_cdb_gu_l3";
            
            var layerSource = {
                    user_name: 'catfordstreettrees',
                    type: 'cartodb',
                    sublayers: [{
                        //sql: "SELECT * FROM " + tableName, // Tree Data
						sql: sqlString1,
                        cartocss: $("#single_colour").html() // Simple visualization
                    }]
            }

			// Create layer selector
            function createSelector(layer) {
				// Swap CartoCSS
				var condition = ""; // SQL or CartoCSS string
				  $('label[name=css_selection]').on('click', function (e) {
					var $label = $(e.target);
					var selected = $label.attr('data');
					$("#switch_style").attr("href", selected + ".css");
					condition = $('#'+selected).text();
					layer.setCartoCSS(condition);
					console.log(condition);
					})
				//var $options1 = $(".layer_selector").find("input");
				var sql = new cartodb.SQL({ user: 'catfordstreettrees' });
				$('input.filter').click(function showSelectedValues() {
							var selected_genus = $("input[name=genus]:checked").map(function () {return this.value;}).get().join(",");
							var selected_ward = $("input[name=ward]:checked").map(function () {return this.value;}).get().join(",");
							var selected_age = $("input[name=age]:checked").map(function () {return this.value;}).get().join(",");
							var selected_condition = $("input[name=condition]:checked").map(function () {return this.value;}).get().join(",");
							var selected_category = $("input[name=category]:checked").map(function () {return this.value;}).get().join(",");
							//console.log(!selected_genus || !selected_ward || !selected_age || !selected_condition || !selected_category);
							//test none of the filters are blank, i.e. all unselected
							if((!selected_genus || !selected_ward || !selected_age || !selected_condition || !selected_category) === false) {
								var sqlString1 = "with genus_label as (select distinct genus from " + tableName +  "), " +
												 "tree_count as (select genus, count(*) from " + tableName + " " +
												 "where ward in (" + selected_ward + ") " +
												 "and age in (" + selected_age + ") " +
												 "and condition in (" + selected_condition + ") " +
												 "and category in (" + selected_category + ") " +
												 "group by genus) " +
												 "select genus_label.genus, " +
												 "CASE WHEN tree_count.count is null THEN 0 ELSE tree_count.count END " +
												 "FROM genus_label " +
												 "left outer join tree_count " +
												 "on genus_label.genus = tree_count.genus ";
								//console.log(sqlString1);
								//sql.execute("select genus, count(*) FROM "+ tableName +" where ward in (" + selected_ward + ") and age in (" + selected_age + ") and condition in (" + selected_condition + ") and category in (" + selected_category + ") group by genus")
								sql.execute(sqlString1)
								.done(function(data) {
									for (var i = 0; i < data.total_rows; i++) {
									  $("label[for = " + data.rows[i].genus +"]").text(data.rows[i].genus + " - " + data.rows[i].count);
									}
								});
								//alert(selected_genus);
								//alert($("input[name=genus]:checked").map(
								 //function () {return this.value;}).get().join(","));
								var sqlString = "SELECT * FROM " + tableName + " WHERE genus IN (" + selected_genus + ") AND ward IN (" + selected_ward + ") AND age IN (" + selected_age + ") AND condition IN (" + selected_condition + ") AND category IN (" + selected_category + ")";
								//alert(sqlString);
								layer.setSQL(sqlString);
								sql.getBounds(sqlString).done(function(bounds) {
								  //map_object.setBounds(bounds);
								  //console.log(bounds);
								  //map_object.fitBounds(bounds,{paddingBottomRight:[420,0]});
								 map_object.fitBounds(bounds);
								});
							}
						});
			}
            // Instantiate new map object, place it in 'map' element
            var map_object = new L.Map('map', {
                center: [51.4531,0.0486], // Lewisham, London
                zoom: 13,
				fullscreenControl: true,
				shareable: true
            });
            // Pull tiles from CartoDB's basemaps
			//L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
            L.tileLayer('https://a.tiles.mapbox.com/v4/catfordstreettrees.6a4f6911/{z}/{x}/{y}.png?access_token={token}', {
			//L.tileLayer('https://a.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token={token}', {			
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				token: 'pk.eyJ1IjoiY2F0Zm9yZHN0cmVldHRyZWVzIiwiYSI6IjQ2ZjQ3MjE0Y2RlMjc0MTA1YmQwOGRjMTk4MDExMDU3In0.3Zb9rrfLQNJOne4iw01YUQ',
				maxZoom: 18,
				minZoom: 10
            }).addTo(map_object);
            // for storing sublayer outside of createlayer
            var sublayer;
            // Add data layer to your map
            cartodb.createLayer(map_object,layerSource,{legends:true})
                .addTo(map_object)
                .done(function(layer) {
                    sublayer = layer.getSubLayer(0);
					//sublayer.set(subLayerOptions);
					//sublayer.infowindow.set('template', $('#infowindow_template').html());			
					//sublayer.on('featureClick', function(e, latlng, pos, data) {alert("Hey! You clicked " + data.cartodb_id);});
					//cdb.vis.Vis.addInfowindow(map_object, layer.getSubLayer(0), ['cartodb_id'])
					cdb.vis.Vis.addInfowindow(map_object, sublayer, ['genus','species_botanical','ward','age','condition','height'], {
					 // we provide a nice default template, if you want yours uncomment this
					 //infowindowTemplate: $('#infowindow_template').html()
				   });
				   sublayer.setInteraction(true);
							
                    createSelector(sublayer);
                })
                .error(function(err) {
                    console.log("error: " + err);
                });
			
			var sql = new cartodb.SQL({ user: 'catfordstreettrees' });
			var selected_ward = $("input[name=ward]:checked").map(function () {return this.value;}).get().join(",");
					//sql.execute("select genus, count(*) FROM "+ tableName +" where ward in (" + selected_ward + ") group by genus")
					sql.execute(sqlString2)
					.done(function(data) {
						for (var i = 0; i < data.total_rows; i++) {
						  $("label[for = " + data.rows[i].genus +"]").text(data.rows[i].genus + " - " + data.rows[i].count);
						}
					});
			
			var sql1 = new cartodb.SQL({ user: 'catfordstreettrees' });
			sql1.getBounds(sqlString1).done(function(bounds) {
			  //map_object.setBounds(bounds);
			  //console.log(bounds);
			  map_object.fitBounds(bounds);
			});

            };
		// Add Legend to map		
		//	var legend = new cdb.geo.ui.Legend.Custom({
		//		title:   "Genus",
		//		data: legend_data
        // });
        // $('#map').append(legend.render().el);