define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/Color",
	"dojo/dom-construct",
	"esri/dijit/Popup",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"esri/InfoTemplate",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol"],
    function(declare, lang, array, Color, domConstruct, Popup, IdentifyTask, 
    	IdentifyParameters, InfoTemplate, SimpleFillSymbol, SimpleLineSymbol){
        return declare([], {
        	handle: null,
        	map: null,
        	url: null,
        	content: null,
        	
        	constructor: function (params) {
				params = params || {};
				
			    if (!params.map) {
			      console.error("app.tasks.Identify: Unable to find the 'map' property in parameters");
			    }

			    if (!params.url) {
			      console.error("app.tasks.Identify: Unable to find the 'url' property in parameters");
			    }			    
			    			    
			    this.map = params.map; // REQUIRED
			   	this.url = params.url; // REQUIRED	
			   	this.layerIds = params.layerIds ? params.layerIds : []; // OPTIONAL
			   	
			   	this._init();
			},			
						
			activate: function() {
				console.log("identify activate");
				this.handle = this.map.on("click", lang.hitch(this, "_doIdentify"));
			},
			
			deactivate: function() {
				console.log("identify deactivate");
				if (this.handle) {
					this.handle.remove();
				}				
			},
			
			_init: function() {
				console.log("identify _init");
				
				var popup = new Popup({
					// Define symbology for identify result
		        	fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2), new Color([255,255,0,0.25]))
		        }, domConstruct.create("div"));
		        
		        // Change infoWindow on map
		        this.map.setInfoWindow(popup);				
				
				this.identifyTask = new IdentifyTask(this.url);

		        this.identifyParams = new IdentifyParameters();
		        this.identifyParams.tolerance = 3;
		        this.identifyParams.returnGeometry = true;
		        this.identifyParams.layerIds = this.layerIds;
		        this.identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
		       	this.identifyParams.width  = this.map.width;
		        this.identifyParams.height = this.map.height;
		        
		        this.map.infoWindow.resize(415, 200);
		        this.map.infoWindow.setTitle("Identify Results");		
			},
			
			_doIdentify: function(evt) {
				console.log("identify _doIdentify");
				
				this.map.graphics.clear();
		        this.identifyParams.geometry = evt.mapPoint;
		        this.identifyParams.mapExtent = this.map.extent;
		        
		        var deferred = this.identifyTask.execute(this.identifyParams);
		        
		        deferred.addCallback(function(response) {     
		        	return array.map(response, function(result) {
		            	var feature = result.feature;
		            	feature.attributes.layerName = result.layerName;
		            	
		            	// TODO: formatting function could be a parameter of the task
		            	if(result.layerName === "Tax Parcels"){
		              		var template = new InfoTemplate(result.layerName, "${Postal Address} <br/> Owner of record: ${First Owner Name}");
		              		feature.setInfoTemplate(template);
		            	} else if (result.layerName === "Building Footprints"){
		              		var template = new InfoTemplate(result.layerName, "Parcel ID: ${PARCELID}");
		              		feature.setInfoTemplate(template);
		            	}
		            	return feature;
		        	});
	        	});

		        this.map.infoWindow.setFeatures([ deferred ]);
		        this.map.infoWindow.show(evt.mapPoint);
			}
        });
    }
);
	