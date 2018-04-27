function normalize(array){
	// normalizes an array of data to a mean of zero (does not normalize between -1 and 1)
	var square = [];
	var normalized = [];
	var averageOfArray = mean(array);

	//standard deviation
	for (var i = 0; i < array.length; i++){
		square.push(Math.pow((array[i] - averageOfArray), 2));
	};

	var squaredAverage = mean(square);
	var stdDev = Math.sqrt(squaredAverage);

	//normalize
	for (var i = 0; i < array.length; i++){
		normalized.push((array[i] - averageOfArray)/stdDev)
	};

	return normalized;

};
