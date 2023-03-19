function init2D(textCanvas){
    try{
        ctx2d = textCanvas.getContext("2d");
    }
    catch(e) {}
    if (!ctx2d)
    {
        alert("Could not initialize 2d Context!");
    }
}

var t_val = 0.5;
var r_parameters = [];
var currentRparamIdx = 0;
var r_param_changed_by_user = [];

var controlPolygons = [];
var curveSegments = [];
var controlPoints = [];

// second curve to be drawn
var twoBezierCurvesNeeded = false;

var pointsArray = [];
var vectorsArray = [];

var timeNow = 0;
var fps = 0;
var timeLast = 0;

var t_param = 0.5;
var showControlPolygon = false;
var requirementsFulfilled = false;
var drawCurve = false;
var drawConstructions = false;
var drawUnitVectors = true;
var drawSecondCurve = false;
var isDragging = false;
var dragPointIdx = -1;
var dragVectorIdx = -1;
var redrawCanvas = true;
var showCoordinateSystem = true;

function drawDot(center, size, color="black") {
    ctx2d.beginPath();
	ctx2d.arc(center.x, center.y, size, 0, 2 * Math.PI, false);
	ctx2d.lineWidth = 2;
	ctx2d.fillStyle = "green";
	ctx2d.fill();
	ctx2d.strokeStyle = "green";
	ctx2d.stroke();
}

function drawVector(fromx, fromy, tox, toy) {
    var headlen = 5; // length of vector head
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);

    ctx2d.beginPath();
    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = "black";
    ctx2d.moveTo(fromx, fromy);
    ctx2d.lineTo(tox, toy);
    ctx2d.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx2d.moveTo(tox, toy);
    ctx2d.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx2d.stroke();
}

function drawLine(from, to, color="black")
{
	ctx2d.beginPath();
    ctx2d.lineWidth = 1.5;
	ctx2d.strokeStyle = color;
	ctx2d.moveTo(from.x, from.y);
	ctx2d.lineTo(to.x, to.y);
	ctx2d.stroke();
}

function drawGrid()
{
    var grid_size = 20;
    for (var x = 0.5; x < ctx2d.canvas.width; x += grid_size) { // draw vertical lines
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, ctx2d.canvas.height);
    }

    for (var y = 0.5; y < ctx2d.canvas.height; y += grid_size) { // draw horizontal lines
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(ctx2d.canvas.width, y);
    }

    ctx2d.strokeStyle = "#eee";
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
    
    // draw axes
    ctx2d.beginPath();
    ctx2d.moveTo(0, grid_size);
    ctx2d.lineTo(ctx2d.canvas.width, grid_size);
    ctx2d.moveTo(ctx2d.canvas.width - 5, grid_size - 5); // draw vector arrow
    ctx2d.lineTo(ctx2d.canvas.width, grid_size);
    ctx2d.lineTo(ctx2d.canvas.width - 5, grid_size + 5);

    ctx2d.moveTo(grid_size, 0);
    ctx2d.lineTo(grid_size, ctx2d.canvas.height);
    ctx2d.moveTo(grid_size + 5, ctx2d.canvas.height - 5 ); // draw vector arrow
    ctx2d.lineTo(grid_size, ctx2d.canvas.height);
    ctx2d.lineTo(grid_size - 5, ctx2d.canvas.height - 5);
    
    ctx2d.strokeStyle = "#000";
    ctx2d.stroke();

    
    ctx2d.lineWidth = 1;
    ctx2d.strokeStyle = "black";
    ctx2d.fillStyle = "black";
    // Ticks marks along the positive X-axis
    for(i=2; i<(ctx2d.canvas.width/ grid_size); i++) {
        ctx2d.beginPath();
        
        // Draw a tick mark 6px long (-3 to 3)
        ctx2d.moveTo(grid_size*i+0.5, grid_size-3);
        ctx2d.lineTo(grid_size*i+0.5, grid_size+3);
        ctx2d.stroke();

        // Text value at that point
        ctx2d.font = '9px Arial';
        ctx2d.textAlign = 'start';
        ctx2d.fillText(grid_size*i , grid_size*i-2, 15);    
    }

    // Ticks marks along the positive Y-axis
    for(i=2; i<(ctx2d.canvas.height/ grid_size); i++) {
        ctx2d.beginPath();

        // Draw a tick mark 6px long (-3 to 3)
        ctx2d.moveTo(grid_size-3, grid_size*i+0.5);
        ctx2d.lineTo(grid_size+3, grid_size*i+0.5);
        ctx2d.stroke();

        // Text value at that point
        ctx2d.font = '9px Arial';
        ctx2d.textAlign = 'start';
        ctx2d.fillText(grid_size*i, 0.5, grid_size*i+3);
    }

}

function drawMouseCoordinates(){
    //Mouse pointer coordinates
    ctx2d.lineWidth = 1;
    ctx2d.strokeStyle = "black";
    ctx2d.fillText("" + curX + "," + curY, curX, curY);
}
function drawScene() {
    ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height);

    if(showCoordinateSystem){
        drawGrid();
    }
    drawMouseCoordinates();


    if (showControlPolygon) {
        if(controlPolygons.length > 0)
        {
            controlPolygons.forEach((controlPolygon, index) => {
                if(controlPolygon.points.length > 0)
                {
                    for (var i = 0; i < controlPolygon.points.length-1; i++) {
                        drawDot(controlPolygon.points[i], 3);
                        drawLine(controlPolygon.points[i], controlPolygon.points[i+1], "green");
                    }
                }
            });
        }
    }
        
    if (drawCurve) {
        if (redrawCanvas) {
           for(var i = 0; i < controlPolygons.length; i++){
               var curve = [];
               var curveControlPts = [];
                setCurvePoints(t_param, curve, controlPolygons[i].points, curveControlPts);
                if(i >= curveSegments.length){
                    curveSegments.push(curve);
                }
                else{
                    curveSegments[i] = curve;
                }

                if(i >= controlPoints.length){
                    controlPoints.push(curveControlPts);
                }
                else{
                    controlPoints[i] = curveControlPts;
                }
           }
        }
        
        curveSegments.forEach(curve =>{
            for (var i = 0; i < curve.length - 1; i++) {
                drawLine(curve[i], curve[i+1]);
             }
        })
    }
        
    //draw pointsArray
    for (var i = 0; i < pointsArray.length; i++) {
        drawDot(pointsArray[i], 3);
    }
    
    if(drawUnitVectors){
        // draw vectorsArray
        for (var i = 0; i < vectorsArray.length; i++) {
            drawVector(pointsArray[i].x,pointsArray[i].y, vectorsArray[i].x, vectorsArray[i].y);
        }        
    }   

    redrawCanvas = false;

}

function webGLStart() {
    var textCanvas = document.getElementById("textCanvas");
    init2D(textCanvas);

    ctx2d.clearRect(0, 0, textCanvas.width, textCanvas.height);
    //ctx2d.clearColor(0.9,0.9,0.8,1);

    var canvasContainer = document.getElementById("container");
    textCanvas.addEventListener("mousedown", mouseDown, false);
    textCanvas.addEventListener("mouseup", mouseUp, false);
    textCanvas.addEventListener("mouseout", mouseUp, false);
    textCanvas.addEventListener("mousemove", mouseMove, false);
    textCanvas.addEventListener("contextmenu", rightClick, false);
    //textCanvas.addEventListener("click", rightClick, false);    
    
    document.getElementById("myRange").addEventListener("change", function(e) {
        t_val = e.target.value;
        r_parameters[currentRparamIdx] = [t_val,r_parameters[currentRparamIdx][1]];//e.target.value;
        redrawCanvas = true;
        var output = document.querySelector("#r_amount");
        output.textContent = t_val;
        r_param_changed_by_user[currentRparamIdx] = true;
        buildCurveFromPoints();
    }, false);

    document.getElementById("requirements_fulfilled").addEventListener("change", function(e) {
        requirementsFulfilled = e.target.checked;
        redrawCanvas = true;
    }, false);
       
    document.getElementById("draw_curve").addEventListener("change", function(e) {
        toggleDrawCurve(e.target.checked);
        redrawCanvas = true;
    }, false);

    document.getElementById("show_control_polygon").addEventListener("change", function(e) {
        toggleShowControlPolygon(e.target.checked);
        redrawCanvas = true;
    }, false);

    document.getElementById("show_coordinate_system").addEventListener("change", function(e) {
        toggleShowCoordinateSystem(e.target.checked);
        redrawCanvas = true;
    }, false);

    document.getElementById("r_param_idx").addEventListener("change", function(e) {
        currentRparamIdx = e.target.value - 1 ;
        redrawCanvas = true;
        var sliderVal = document.querySelector("#myRange");
        sliderVal.value = r_parameters[currentRparamIdx][0];
        sliderVal.max = r_parameters[currentRparamIdx][1];
        var output = document.querySelector("#r_amount");
        output.textContent = r_parameters[currentRparamIdx][0];
     }, false);

    tick();
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
    timeNow = new Date().getTime();
    fps++;

    if (timeNow - timeLast >= 1000) {
        document.getElementById("FPS").innerText = "FPS: " + Number(fps * 1000.0 / (timeNow - timeLast)).toPrecision(5);

        timeLast = timeNow;
        fps = 0;
    }
}

function setCurvePoints(t_param, curve, controlPolygon, controlPoints) {
    var newCurve = controlPolygon.slice();
    var b = bezier(newCurve, controlPoints);
    for (var i = 0; i <= 100; i++) {
        curve.push( b(i/100, false));
    }
    for (var j = 0; j < controlPolygon.length; j++) {
        controlPoints.push( b(t_param, true) );
    }    
}

function getMouseCoord(event)
{
	var canvas = document.getElementById("textCanvas");
    var canvasRect = canvas.getBoundingClientRect();
	var x = event.clientX - canvasRect.left;
	var y = event.clientY - canvasRect.top;

	return new Point(x, y);
}

var mouseDown = function(e) {
    e.preventDefault();

    var mouseCoord = getMouseCoord(e);

    isDragging = false;
    dragPointIdx = -1;
    dragVectorIdx = -1;

    const controlPointRaduis = 3;
	var radiusPow = Math.pow(controlPointRaduis, 2);
	const tolerance = 3;

    for (var i = 0; i < vectorsArray.length; ++i)
	{
		var xExpr = Math.pow(mouseCoord.x - vectorsArray[i].x, 2);
		var yExpr = Math.pow(mouseCoord.y - vectorsArray[i].y, 2);
		if (xExpr + yExpr <= radiusPow + tolerance)
		{
			dragVectorIdx = i;
            isDragging = true;
			break;
		}
	}

    return false;
};

var mouseUp = function(e) {
    isDragging = false;
    dragPointIdx = -1;
    dragVectorIdx = -1;
};

var curX;
var curY;
var mouseMove = function(e) {
    
    var mouseCoord = getMouseCoord(e);

    curX = mouseCoord.x;
    curY = mouseCoord.y;
     
	if (isDragging == false)
		return;

    if(dragVectorIdx != -1)
    {
        vectorsArray[dragVectorIdx] = normalizeVector(pointsArray[dragVectorIdx],mouseCoord);
        if(requirementsFulfilled){
            buildCurveFromPoints();
            redrawCanvas = true;
        }
    }
};  

var pointAdd = true;
var rightClick = function(e) {
    e.preventDefault();

    var mouseCoord = getMouseCoord(e);

    // check if point/vector already exists and remove it 
    const controlPointRaduis = 3;
	var radiusPow = Math.pow(controlPointRaduis, 2);
	const tolerance = 10;
	for (var i = 0; i < pointsArray.length; ++i)
	{
		var xExpr = Math.pow(mouseCoord.x - pointsArray[i].x, 2);
		var yExpr = Math.pow(mouseCoord.y - pointsArray[i].y, 2);
		if (xExpr + yExpr <= radiusPow + tolerance)
		{
            pointsArray.splice(i, 1);
            vectorsArray.splice(i, 1); // if point is removed, vector asosiated with it should be removed too
            redrawCanvas = true;
            if(requirementsFulfilled)
            {
                if(pointsArray.length != vectorsArray.length || pointsArray.length < 2){
                    requirementsFulfilled = false;
                    toggleRequirementsCheckbox();
                    toggleDrawCurve(false);
                    toggleShowControlPolygon(false);
                    document.getElementById("draw_curve").checked = false;
                    document.getElementById("show_control_polygon").checked = false;
                }
                else{
                    resetRParam();
                    buildCurveFromPoints();
                }            
            }

            if(pointsArray.length > vectorsArray.length ){
                pointAdd = false;
            }
            else
            {
                pointAdd = true;
            }
			return;
		}
	}

    console.log('x', mouseCoord.x,'y',mouseCoord.y);

    if(pointAdd) {        
        //otherwise - add point to canvas
        pointsArray.push(mouseCoord);
        redrawCanvas = true;
        pointAdd = false;
    }
    else{
        //push normalized vector from first point in the direction of the current point
        vectorsArray.push(normalizeVector(pointsArray[pointsArray.length - 1],mouseCoord));
        redrawCanvas = true;
        pointAdd = true;
    }

    if(pointsArray.length == vectorsArray.length && pointsArray.length >= 2){
        requirementsFulfilled = true;
        toggleRequirementsCheckbox();
        buildCurveFromPoints();
    }
};

var toggleRequirementsCheckbox = function(e) {
    var element = document.getElementById("requirements_fulfilled")
    element.checked = requirementsFulfilled
};

function clearCanvas(){
    pointsArray = [];
    vectorsArray = [];	
    controlPolygons = [];
    curveSegments = [];
    controlPoints = [];
    requirementsFulfilled = false;

    redrawCanvas = true;

    toggleDrawCurve(false);
    toggleShowControlPolygon(false);

    document.getElementById("draw_curve").checked = false;
    document.getElementById("show_control_polygon").checked = false;
    
    resetRParam();    
}

function resetRParam(){

    r_parameters = [];
    currentRparamIdx = 0;
    r_param_changed_by_user = [];
    
    var range_elem = document.getElementById("myRange");
    range_elem.max = 1;
    range_elem.value = 0;
    var output = document.querySelector("#r_amount");
    output.textContent = 0;

    clearRParamDropDownOptions();
}

function clearRParamDropDownOptions(){
    var drop_down = document.getElementById("r_param_idx");
    while(drop_down.length > 1)
    {
        drop_down.remove(drop_down.length-1);
    }
}

function toggleDrawCurve(checked){
    drawCurve = checked;
    drawSecondCurve = checked;
    redrawCanvas = true;
}

function toggleShowControlPolygon(checked){
    showControlPolygon = checked;    
    drawConstructions = checked;
    redrawCanvas = true;
}

function toggleShowCoordinateSystem(checked)
{
    showCoordinateSystem = checked;
    redrawCanvas = true;
}

/////// 
//
// Math functionality
//
///////
class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

class ControlPolygon
{
    constructor(){
        this.points = [];
    }

    addPoint(point){
        this.points.push(point);
    }
}
  
// Given three collinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment(p, q, r)
{
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
    return true;
    
    return false;
}
  
// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function getOrientation(p, q, r)
{
  
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    let val = (q.y - p.y) * (r.x - q.x) -
            (q.x - p.x) * (r.y - q.y);
    
    if (val == 0) return 0; // collinear
    
    return (val > 0)? 1: 2; // clock or counterclock wise
}
  
// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2)
{
  
    // Find the four orientations needed for general and
    // special cases
    let o1 = getOrientation(p1, q1, p2);
    let o2 = getOrientation(p1, q1, q2);
    let o3 = getOrientation(p2, q2, p1);
    let o4 = getOrientation(p2, q2, q1);
    
    // General case
    if (o1 != o2 && o3 != o4)
        return true;
    
    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
    
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
    
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
    
    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
    
    return false; // Doesn't fall in any of the above cases
}

function bezier(pts, controlPoints) {
    return function (t, shouldTakeSamples) {
        for (var a = pts; a.length > 1; a = b)  // do..while loop in disguise
            for (var i = 0, b = [], j; i < a.length - 1; i++)  // cycle over control points
              {	
                b[i] = new Point(); // cycle over dimensions
                b[i].x = a[i].x * (1 - t) + a[i+1].x * t;
                b[i].y = a[i].y * (1 - t) + a[i+1].y * t;

                if(shouldTakeSamples){
                     controlPoints.push(b[i]);
                }
              } // interpolation
        return a[0];
    }
}

function normalizeVector(originPoint, destPoint) {
    var xO = originPoint.x;
    var yO = originPoint.y;
    var xD = destPoint.x;
    var yD = destPoint.y;
    
    var vectorLength = Math.abs(Math.sqrt((xD-xO)*(xD-xO) + (yD-yO)*(yD-yO)) );
    var normX = xO + 25 * (xD-xO)/vectorLength;
    var normY = yO + 25 * (yD-yO)/vectorLength;
    var normVectorEndPoint = new Point(normX, normY);

    return normVectorEndPoint;
}

function getVectorWithLength(originPoint, destPoint, r_param) {
    var xO = originPoint.x;
    var yO = originPoint.y;
    var xD = destPoint.x;
    var yD = destPoint.y;
    var vectorLength = Math.abs(Math.sqrt((xD-xO)*(xD-xO) + (yD-yO)*(yD-yO)) );
    var endX = xO + (r_param) * (xD-xO)/vectorLength;
    var endY = yO + (r_param) * (yD-yO)/vectorLength;
    var vectorEndPoint = new Point(endX, endY);

    return vectorEndPoint;
}

function getLineEquasion(originPoint, destPoint) {
    var A = destPoint.y - originPoint.y;
    var B = originPoint.x - destPoint.x;
    var C = (A * originPoint.x) + (B * originPoint.y);

    return [A,B,C];
}

function findIntersectionPoint(line1, line2){
    var A1 = line1[0];
    var B1 = line1[1];
    var C1 = line1[2];

    var A2 = line2[0];
    var B2 = line2[1];
    var C2 = line2[2];

    var det = A1*B2 - A2*B1;
    if(det == 0)
    {
        console.log("Lines are parallel");
        return null;
    }
    else
    {
        var x = (B2 * C1 - B1 * C2) / det;
        var y = (A1 * C2 - A2 * C1) / det;
        return new Point(x,y);
    }
}

function checkForIntersection(firstIndex, secondIndex) {
    var origin1 = pointsArray[firstIndex];
    var dest1 = vectorsArray[firstIndex];
    var origin2 = pointsArray[secondIndex];
    var dest2 = vectorsArray[secondIndex];

    // get line equasions with two points given
    var line1 = getLineEquasion(origin1, dest1);
    var line2 = getLineEquasion(dest2, origin2);
    var pointOfIntersection = findIntersectionPoint(line1, line2);
    if(pointOfIntersection != null)
    {
        let V0 = new Point(dest1.x - origin1.x, dest1.y - origin1.y);
        let V1 = new Point(dest2.x - origin2.x, dest2.y - origin2.y);
        let QQ0 = new Point(pointOfIntersection.x - origin1.x, pointOfIntersection.y - origin1.y);
        let Q1Q = new Point(origin2.x - pointOfIntersection.x, origin2.y - pointOfIntersection.y);

        // CHECK# calculate dot product between two vectors to see if they point in the same direction
        var QQ0dotV0 = QQ0.x * V0.x + QQ0.y * V0.y;
        var Q1QdotV1 = Q1Q.x * V1.x + Q1Q.y * V1.y;
        
        if((QQ0dotV0 > 0) && (Q1QdotV1 > 0))
        {
            console.log("One Bezier curve will suffice");
            twoBezierCurvesNeeded = false;
            var controlPolygon = new ControlPolygon;
            controlPolygon.points.push(pointsArray[firstIndex], pointOfIntersection, pointsArray[secondIndex]);
            controlPolygons.push(controlPolygon);
        }
        else
        {
            console.log("One point of intersection but different directions");
            twoBezierCurvesNeeded = true;
            
            calculateRParameter(firstIndex, secondIndex);
            makeNecessaryConstructions(firstIndex, secondIndex);
        }
    }
    else{
        console.log("Two Bezier curves are needed - lines are parallel");
        twoBezierCurvesNeeded = true;
            
        calculateRParameter(firstIndex, secondIndex);
        makeNecessaryConstructions(firstIndex, secondIndex);
    }
};

function makeNecessaryConstructions(firstIndex, secondIndex){
    if(pointsArray.length != vectorsArray.length)
    {
        console.log("Error! Not matching requirements!");
        return;
    }
   
    var constructedVectorsArray = [];
    constructedVectorsArray.push(pointsArray[firstIndex], getVectorWithLength(pointsArray[firstIndex],vectorsArray[firstIndex], r_parameters[firstIndex][0]));
    constructedVectorsArray.push(pointsArray[secondIndex], getVectorWithLength(pointsArray[secondIndex],vectorsArray[secondIndex], -r_parameters[firstIndex][0]));
    // connect the two extended vectors
    constructedVectorsArray.push(constructedVectorsArray[1], constructedVectorsArray[3]);

    var midPoint = new Point((constructedVectorsArray[1].x + constructedVectorsArray[3].x)/2 ,(constructedVectorsArray[1].y + constructedVectorsArray[3].y)/2, 0.0);

    var controlPolygon = new ControlPolygon;
    controlPolygon.points.push(constructedVectorsArray[0], constructedVectorsArray[1], midPoint);
    controlPolygons.push(controlPolygon);
    
    var secondControlPolygon = new ControlPolygon;
    secondControlPolygon.points.push(midPoint, constructedVectorsArray[3],constructedVectorsArray[2]);
    controlPolygons.push(secondControlPolygon);
}

function calculateRParameter(firstIndex, secondIndex)
{    
    var r_param_max = 0;

    if(r_param_changed_by_user[firstIndex] == true)
    {
        return;
    }

    var xO = pointsArray[secondIndex].x;
    var yO = pointsArray[secondIndex].y;
    var xD = pointsArray[firstIndex].x;
    var yD = pointsArray[firstIndex].y;

    var vectorLength = Math.abs(Math.sqrt((xD-xO)*(xD-xO) + (yD-yO)*(yD-yO)) );
    r_param_max = vectorLength / 3;
    t_val = 0.3 * r_param_max;

    //r_parameters.splice(firstIndex, 1, [t_val, r_param_max]);
    if(JSON.stringify(r_parameters[firstIndex]) != JSON.stringify([t_val, r_param_max])){
    
        r_parameters[firstIndex] = [t_val, r_param_max];

        var range_elem = document.getElementById("myRange");
        range_elem.max = r_param_max;
        range_elem.value = t_val;
        var output = document.querySelector("#r_amount");
        output.textContent = t_val;

        var drop_down = document.getElementById("r_param_idx");
        var optionAlreadyIn = false;
        currentRparamIdx = firstIndex;
        for( var i = 0; i < drop_down.options.length; i++){
            if(drop_down.options[i].value == firstIndex+1){
                optionAlreadyIn = true;
            }
        }
        if(!optionAlreadyIn){
            var option = document.createElement("option");
            option.text = firstIndex+1;
            option.value = firstIndex+1;
            option.selected = true;
            drop_down.add(option);
        }
    }
}

function buildCurveFromPoints()
{
    controlPolygons = [];
    curveSegments = [];
    controlPoints = [];

    pointsArray.forEach((element, index) => {
        if(index != pointsArray.length -1)
        {
            checkForIntersection(index, index +1);
        }        
    });
}