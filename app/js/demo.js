//osascript -e 'tell application "Finder" to set desktop picture to POSIX file "/Users/fundon/Downloads/pattern.jpeg"'
const $ = require('jquery')
const GeoPattern = require('geopattern')
const fs = require('fs')
const os = require('os')
const exec = require('child_process').exec

var next = (function () {
	var which = 0;
	return function () {
		return {
			prev: which,
			next: which = (which + 1) % 2
		}
	}
}())

// Hook and debounce input event
function onChange($el, cb) {
	var last = $el.val()
	$el.on('input', function () {
		var val = $el.val()
		var oldVal
		if (last !== val) {
			oldVal = last
			last = val
			typeof cb === 'function' && cb.call($el, val, oldVal)
		}
	})

	return {
		trigger: function () {
			typeof cb === 'function' && cb.call($el, $el.val(), last)
		}
	}
}

var fadeOptions = {
	duration: 100,
	queue: false
}

var canvas = document.createElement('canvas')
var saveButton = document.getElementById('save')
var changeButton = document.getElementById('change')
var str = ''

function prepareDownload(string, pattern) {
	if (!canvas) {
		canvas = document.createElement('canvas')
	}

	var ctx = canvas.getContext('2d')
	var img = new Image()

	img.onload = function() {
		canvas.width = this.width
		canvas.height = this.height
		ctx.drawImage(img, 0, 0)
		saveButton.download = string + '.png'
		try {
      			str = canvas.toDataURL('image/png')
			saveButton.href = str
		} catch (err) {
			// The above is a security error in IE, so hide the save button
			saveButton.style.display = 'none'
		}
	};

	img.src = pattern.toDataUri()
}

var changeEvent = onChange($('#string'), function (val) {
	var pattern = GeoPattern.generate(val)

	var bg = next()
	$('#bg-' + bg.next)
		.css('background-image', pattern.toDataUrl())
		.stop()
		.fadeIn(fadeOptions)
	$('#bg-' + bg.prev)
		.stop()
		.fadeOut(fadeOptions)

	prepareDownload(val, pattern)
})

// Some browsers persist field values between refresh
$(function () {
	$('#string')
		.val('  start typing...  ')
		.focus()
	changeEvent.trigger()

  	$('#change').on('click', function() {
    		var buf = new Buffer(str.replace(/^data:image\/png;base64,/, ''), 'base64')
    		var filename = os.homedir() + '/Pictures/Patterns/' + saveButton.download
    		fs.writeFile(filename, buf, function (err) {
      			console.log(err);
      			console.log('done');
      			if (!err) {
        			console.log(`\'tell application "Finder" to set desktop picture to POSIX file "${filename}"\'`)
        			exec(`osascript -e \'tell application "Finder" to set desktop picture to POSIX file "${filename}"\'`, function(err, data) {
          				console.log(err, data)
        			})
      			}
    		})
  	})

})
