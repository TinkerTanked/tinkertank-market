// Calendar Testing Script - Run in browser console
console.log("🔍 Starting Calendar Debug Test");

// Test 1: Check if calendar elements exist
const calendarGrid = document.querySelector('[style*="grid-template-columns"]');
const calendarButtons = document.querySelectorAll('button[disabled="false"], button:not([disabled])');
const dateElements = document.querySelectorAll('span[style*="font-size"]');

console.log("📊 Calendar Elements Found:", {
  calendarGrid: !!calendarGrid,
  totalButtons: calendarButtons.length,
  dateElements: dateElements.length,
  firstButtonText: calendarButtons[0]?.textContent || 'none',
  gridStyles: calendarGrid?.style.gridTemplateColumns || 'none'
});

// Test 2: Check if dates are visible
const visibleDates = Array.from(dateElements).filter(el => 
  el.textContent && 
  !el.textContent.includes('Closed') && 
  el.offsetHeight > 0 &&
  el.offsetWidth > 0
);

console.log("📅 Visible Dates:", {
  count: visibleDates.length,
  first5: visibleDates.slice(0, 5).map(el => el.textContent),
  styles: visibleDates[0]?.style || {}
});

// Test 3: Test click functionality
if (calendarButtons.length > 0) {
  console.log("🖱️ Testing click on first available button");
  const testButton = Array.from(calendarButtons).find(btn => 
    !btn.disabled && 
    btn.textContent && 
    !btn.textContent.includes('Closed')
  );
  
  if (testButton) {
    console.log("✅ Found clickable button:", testButton.textContent);
    // Add event listener to test
    testButton.addEventListener('click', () => {
      console.log("🎯 Button clicked successfully!", testButton.textContent);
    });
  }
}

// Test 4: Check Tailwind CSS loading
const testDiv = document.createElement('div');
testDiv.className = 'bg-blue-500 text-white p-4';
document.body.appendChild(testDiv);
const computedStyles = window.getComputedStyle(testDiv);
console.log("🎨 Tailwind CSS Check:", {
  backgroundColor: computedStyles.backgroundColor,
  color: computedStyles.color,
  padding: computedStyles.padding,
  isTailwindLoaded: computedStyles.backgroundColor.includes('59, 130, 246') // rgb(59, 130, 246) = bg-blue-500
});
document.body.removeChild(testDiv);

console.log("✅ Calendar Debug Test Complete");
