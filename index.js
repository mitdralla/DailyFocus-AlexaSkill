/**
 * This is a skill for Daily Focus - Wellness Pillars. A skill to keep your wellness a top priority for the day.
 * To open the skill say: "Alexa, open Daily Focus."
 * 
 * Written by:  Timothy Allard
 * Date:        10/2018
 * Version:     1.0
 * Website:     http://timothyallard.com/daily-focus
 * LinkedIn:    https://www.linkedin.com/in/timallard/
 * Github:      @mitdralla
 * 
*/

// I run a tight ship here, complain if we start slacking!
'use strict';
var Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback) 
{
    var alexa = Alexa.handler(event, context, callback);
    
    // Defines the table name we will use in DynamoDB to store our attributes.
    alexa.dynamoDBTableName = 'dailyFocus';
    
    // Our official skill app id from http://developer.amazon.com
    alexa.appId = "";
        
    // Register the custom handelers and execute them.
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'NewSession': function() {
        
        // Let's check to see if the user is new or not.
        if(Object.keys(this.attributes).length === 0) {
            
            // If so, let's tell the skill the user has never been here before.
            this.attributes['is_new_user'] = "yes";
        }
        // Move on to LaunchRequest.
        this.emit("LaunchRequest");
    },
    'LaunchRequest': function() {
        
        // Initial skill launch handler - let's call the welcome function.
        getWelcome.call(this);
        this.emit(':saveState', true);
    },
    'FocusIntent': function() {
        
        if (this.attributes['previous_place'] === "confirm_focus") {
            
            focusConfirmation.call(this);
        } else if (this.attributes['previous_place'] ===  "focus_confirmation") {
            
            getIdeas.call(this);
        } else {
            
            this.attributes.is_another = " ";
            getFocus.call(this);
        }
    },
    'CompleteIntent': function() {
        
        if (this.attributes['previous_place'] === "confirm_focus") {
            
            focusConfirmation.call(this);
        } else if (this.attributes['previous_place'] ===  "focus_confirmation") {
            
            getIdeas.call(this);
        } else {
            
            this.attributes.is_another = " ";
            getFocus.call(this);
        }
    },
    'AnotherIntent': function () {
        
        // The user did not like the first focus and asked for another.
        // Set the is_another attribute so we can toggle some text.
        this.attributes.is_another = "yes";
        getFocus.call(this);
    },
    'IdeasIntent': function() {
        
    },
    'SessionEndedRequest': function () {
        
        // A little logging
        console.log('session ended!');
        
        // Save all the attributes to dynamoDB
        this.emit(':saveState', true);

    },
    'AMAZON.YesIntent' : function() {
        
        if(this.attributes['previous_place'] === 'welcome') {
            
            // This is the main function which generates a random focus (possibly based on session attribute criteria to filter specific categories of focuss).
            getFocus.call(this);
        } else if (this.attributes['previous_place'] === "get_focus") {
            
            // We just presented the user with a focus, and they want to do it.
            this.attributes.is_another = " ";
            confirmFocus.call(this);
        } else if (this.attributes['previous_place'] === 'focus_confirmation') {
            
            getIdeas.call(this);
        } else if (this.attributes['previous_place'] === "get_ideas") {
            
            // Now that we have determined the text, we can reset the is_another_focus flag.
            getIdeas.call(this);
        } else if (this.attributes['previous_place'] === "is_focus_complete_confirmation") {
            
            // The skill recognized the user is returning after making a new focus. The user just confirmed they completed it.
            focusConfirmationAward.call(this);
        } else if (this.attributes['previous_place'] === 'focus_confirmation_award') {
            
            getFocus.call(this);
        } else if (this.attributes['previous_place'] === 'give_support') {
            
            getFocus.call(this);
        } else if (this.attributes['previous_place'] === 'continue_focus') {
            
            getIdeas.call(this);
        } else {
            
            this.response.speak('Good Bye. Come back again tomorrow to get a new focus.');
            this.emit(':responseReady');
        }
        
    },
    'AMAZON.NoIntent' : function() {
        
        // When given a focus, the user might say no instead of give me another, let's handle that scenario also.
        if (this.attributes['previous_place'] === "get_focus") {
            
            // Set the is_another attribute so we can toggle some text.
            this.attributes.is_another = "yes";
            getFocus.call(this);
        } else if (this.attributes['previous_place'] === "is_focus_complete_confirmation") {
            
            giveSupport.call(this);
        } else if (this.attributes['previous_place'] === "give_support") {
            
            continueFocus.call(this);
        } else if (this.attributes['previous_place'] === "continue_focus") {
            
            this.response.speak('Good Bye. Come back again tomorrow to get a new focus.');
            this.emit(':responseReady');
        } else {
            
            this.response.speak('Good Bye. Come back again tomorrow to get a new focus.');
            this.emit(':responseReady');  
        }
    },
    'AMAZON.StopIntent' : function() {
        
        this.response.speak('Good Bye. Come back again soon to get a new focus.');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        
        this.response.speak("You can say: what's my focus");
        this.response.listen("You can say: give me a focus");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        
        this.response.speak('Good Bye. Come back again tomorrow to get a new focus.');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        
        // The skill did not know how to handle the users response. So - elegantly fail.
        this.emit('AMAZON.HelpIntent');
    }
};

//=========================================================================================================================================
// FUNCTIONS
//=========================================================================================================================================

function getWelcome(data) 
{
    // Let's give the user a big welcome. If they are a first time user, let's give them a more in-depth welcome.  
    // For temporary purposes, staticly define a users name.
    let speechOutput = "";
    let speechReprompt = "";

    // Set a previous_place attribute to the session. This is an important attribute which will help us determine where the user came from when getting deeper into conversation.
    this.attributes['previous_place'] = "welcome";
    
    // Check to see if there is a session attribute called is_new_user with the value of yes. This gets determined and set in NewSession handler.
    if (this.attributes['is_new_user'] == "yes") {
        // This is a new user - give them a big welcome.
        speechOutput = "Welcome to Daily Focus. A skill that keeps your wellness a top priority for the day. " + one_second_break + " Your total wellness crosses many different pillars. Like a physical pillar, social, financial even vocational. So here is how it works." + one_second_break + " I am going to give you a focus to think about, I want you to make that a priority over the course of the next 24 hours. Once it is complete, you will come back to get a new one. " + one_second_break + " Would you like to hear your focus?";
        
        // Give the user 10 focus points for joining.
        this.attributes['focus_points'] = 0;
        this.attributes['focus_points'] += 10;

        // Reprompt to the user if they did not respond within 8 seconds.
        speechReprompt = "Would you like to hear your focus?";
        
        this.response.speak(speechOutput);
        this.response.listen(speechReprompt);
        this.emit(':responseReady');
    } else {
        
        // This is not a users first time, they have been here before and got a focus.
        this.attributes['previous_place'] = "is_focus_complete_confirmation";

        // Retrieve the focus that was stored previously in DynamoDB and set the previous_focus variable for easy access.
        if(this.attributes.focus != "") {
            let previous_focus = this.attributes.focus;
            let previous_focus_name = previous_focus.endsession_snippet;
        
            // This is a returning user - keep messaging it short and sweet, they do not need the full intro text.
            speechOutput = "Welcome back! Last time we spoke, you were working on " + previous_focus_name + "." + one_second_break + "I hope you put some thought into it. " + one_second_break + " Were you able to complete this focus?";
            speechReprompt = "Were you able to do your focus?";
            
            // This user is no longer a new user.
            this.attributes['is_new_user'] = "no";
    
            // Output the new attributes we just stored in the users session.
            console.log(JSON.stringify(this.attributes));
            
            this.response.speak(speechOutput);
            this.response.listen(speechReprompt);
            this.emit(':responseReady');
        }
    }   
}

function getFocus(data) 
{
    // Set a previous_place attribute to the session. 
    this.attributes['previous_place'] = "get_focus";
    
    // Placeholder to store a slot variable.
    let categorySlot = "";
    let category = "";
    
    //console.log(JSON.stringify(this.event.request.intent));
    
    // There might not be an intnet.
    if(this.event.request.intent.slots) {
        categorySlot = this.event.request.intent.slots.category;
    }
    
    // Placeholder array to hold some focuss if a user asked for a specific category.
    let filtered_focuss = [];
    let all_focuss = focusArray.focuss;
    
    // If there is a category slot filled, the user wants a specific category of focuss to pick from. Let's get that going.
    if (categorySlot && categorySlot.value) {
        category = categorySlot.value.toLowerCase();
        
        // Store the category in the users attributes so we can offer up a new focus if they don't like the first.
        this.attributes['focus_category'] = category;

        // Loop through all the focuss.
        for (var i = 0; i < all_focuss.length; i++) {
            
            // Find a focus attribute tag that matches the slot value.
            if(all_focuss[i].tag.indexOf(categorySlot.value) !== -1) {
                console.log("---> Matched Focus " + JSON.stringify(all_focuss[i]));
                
                // Create a new temporary array to hold these focuss.
                filtered_focuss.push(all_focuss[i]);
                
                // Save it out to the focus array.
                focusArray.focuss = filtered_focuss;
                
                console.log("---> Filtered Focus Array " + JSON.stringify(focusArray));
            }
        }
    }
    
    // Let's pick a random focus so we can keep it fresh for the user.
    // We will do this by first, getting the length of the array, randomize it, then store the object into the focus variable.
    let focus_array_length = focusArray.focuss.length;
    let focus_id = Math.floor(Math.random()*focus_array_length);
    
    console.log("---> The Focus ID (Something goes wrong here). " + focus_id);
    
    let focus = focusArray.focuss[focus_id];
    
    // There is a possability this focus was generated by a user asking for a new one.
    // If this is the case, let's look for the is_another attribute == YES so we can change up some language.
    let is_another_focus = this.attributes.is_another;
    
    // Make sure we don't go negative. This shouldn't happen, but in the case it did, let's make sure we never see a negative number.
    if(focus_id <= -1) { focus_id = 0; }
    
    // Store the newly grabbed focus in the users session.
    this.attributes['focus'] = focus;

    console.log("---> THE PLEDGE " + JSON.stringify(focus));

    // Next, make it easier to store and call it's attributes.
    let focus_name = focus.name;
    let focus_description = focus.short_description;

    // Let's generate some intro text so the speech is more dynamic.
    let focus_intro_text = focusIntroductionWords[Math.floor(Math.random()*focusIntroductionWords.length)];
    let another_focus_intro_text = anotherFocusIntroductionWords[Math.floor(Math.random()*anotherFocusIntroductionWords.length)];
    let focus_wellness_pillar = focus.pillar;
    let focus_reprompt_snippet = focus.reprompt_snippet;
    let intro_text = "";
    let outro_text = "";
    let another_try_outro = "";
    
    // Toggle some speech based on if the user recieved the focus automatically or if th euser asked for a new one.
    if(is_another_focus === "yes") {
        // The user asked to have a new focus presented to them.
        intro_text = another_focus_intro_text;
        outro_text = "Did you like this one better? ";
        another_try_outro = "Or we could try once more by saying give me another.";
    } else {
        // The user has not asked for a new focus.
        intro_text = focus_intro_text;
        outro_text = "Do you want to make this your focus? ";
        another_try_outro = "Or you can say give me another and I will see what I can come up with.";
    }
    
    // Put it all together. Our dynamic intro text, the focus name, a little pause, the focus description, a little pause, some dynamic outro text, a little pause and some dynamic closing text.
    let speechOutput = intro_text + focus_name + one_second_break + focus_description + one_second_break + " this focus crosses the " + focus_wellness_pillar + " wellness pillar. " + one_second_break + outro_text + one_second_break + "If so, just say yes. " + another_try_outro;
    
    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));

    this.response.speak(speechOutput);
    this.response.listen("Do you want to make this focus about "+ focus_reprompt_snippet +"? If so, just say yes.");
    this.emit(':responseReady');
}

function confirmFocus(data) 
{
    // Set a previous_place attribute to the session.
    this.attributes.previous_place = "confirm_focus";
    
    // Pull out the focus from the users session.
    let focus = this.attributes.focus;
    
    // Generate some dynamic intro text to confirm the focus.
    let confirm_focus_intro_text = confirmFocusIntroductionWords[Math.floor(Math.random()*confirmFocusIntroductionWords.length)];
    
    // Put it all together. Random intro focus text, a little pause, I focus to text, and a confirmation.
    let speechOutput = confirm_focus_intro_text + one_second_break + " I focus to " + focus.focus_confirmation;
    
    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    this.response.speak(speechOutput);
    this.response.listen("Repeat after me, " + one_second_break +" I focus to " + focus.focus_confirmation);
    this.emit(':responseReady');
}

function focusConfirmation(data) 
{
    // Set a previous_place attribute to the session.
    this.attributes.previous_place = "focus_confirmation";
    
    // Give the user a way to go! And let them know how they can act on this immediatly.
    let speechOutput = "<say-as interpret-as=\"interjection\">way to go!</say-as>, you just took a great step at a healthier you! " + one_second_break +" <audio src=\"" + songs.focus_accepted + "\" /> For that, I just gave you 10 Focus points. " + one_second_break + "Now, it's one thing to say you are going to do something, and another to do it. So, to make things easier for you, here are some ways to put this focus into action. Would you like to hear them?";

    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    this.response.speak(speechOutput);
    this.response.listen("Would you like to hear them?");
    this.emit(':responseReady');
    this.emit(':saveState', true);
}

function focusConfirmationAward(data) 
{
    // Set a previous_place attribute to the session.
    this.attributes.previous_place = "focus_confirmation_award";
    
    // Let's award the user for completing the focus.
    this.attributes['focus_points'] += 10;

    // Give the user a way to go! And let them know how they can act on this immediatly.
    let speechOutput = "Fantastic job! Step by step you are improving your overall wellness! " + one_second_break +" For that, I will give you 10 focus points." + one_second_break + "<audio src=\"" + songs.focus_accepted + "\" /> Would you like to make another focus?";

    // OK, the user got their points for doing the focus, let's change the previous place so they can't get points again.
    this.attributes['previous_place'] = "welcome";
    
    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    this.response.speak(speechOutput);
    this.response.listen("Would you like to make another focus?");
    this.emit(':responseReady');
    this.emit(':saveState', true);
}

function giveSupport(data) 
{
    // Set a previous_place attribute to the session.
    this.attributes.previous_place = "give_support";

    // Give the user a way to go! And let them know how they can act on this immediatly.
    let speechOutput = "Better wellness takes time and dedication. Don't give up. If you would like to switch to a new focus, just say yes. Or say no and we will keep it the same for now.";

    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    this.response.speak(speechOutput);
    this.response.listen("Would you like to make another focus?");
    this.emit(':responseReady');
    this.emit(':saveState', true);
}

function continueFocus(data) 
{
    // Set a previous_place attribute to the session.
    this.attributes.previous_place = "continue_focus";
    
    let previous_focus = this.attributes.focus;
    let previous_focus_name = previous_focus.endsession_snippet

    // Give the user a way to go! And let them know how they can act on this immediatly.
    let speechOutput = "Thats great to hear. Keep focus and think about " + previous_focus_name + " Would you like to hear how you can accomplish this?";

    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    this.response.speak(speechOutput);
    this.response.listen("Would you like to make another focus?");
    this.emit(':responseReady');
    this.emit(':saveState', true);
}

// Here is how to take action. Called after a user makes their focus.
function getIdeas(something)
{
    this.attributes.previous_place       = "get_ideas";
    var the_focus                       = this.attributes.focus;
    var focus_examples_array_length     = this.attributes.focus.examples.length;
    var focus_example_id                = Math.round(Math.random()*focus_examples_array_length) -1;
    let focus_example                   = "";
    let focus_endsession_snippet        = "";

    console.log(this.attributes.focus.name);

    // Make sure we don't go negative.
    if(focus_example_id <= 0) { focus_example_id = 1; }

    console.log(focus_example_id);

    focus_example                       = this.attributes.focus.examples.example_1;
    focus_endsession_snippet            = this.attributes.focus.endsession_snippet;

    // Let's see wht we got.
    console.log(focus_example);
    
    // Output the new focus we just stored in the users session.
    console.log(JSON.stringify(this.attributes));
    
    let speechOutput = focus_example + one_second_break + " Would you like to hear another idea?";

    this.response.speak(speechOutput);
    this.response.listen("Would you like to hear another idea?");
    this.emit(':responseReady');
}

// Helper functions from the Amazon Team to handle slot values.
function isSlotValid(request, slotName){
        var slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        var slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue;
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}

function getSlotValues (filledSlots)
{
    // Given event.request.intent.slots, a slots values object so you have
    // What synonym the person said - .synonym
    // What that resolved to - .resolved
    // And if it's a word that is in your slot values - .isValidated
    let slotValues = {};

    console.log(JSON.stringify(filledSlots));

    Object.keys(filledSlots).forEach(function(item) {
        //console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));
        var name=filledSlots[item].name;
        //console.log("name: "+name);
        if(filledSlots[item]&&
           filledSlots[item].resolutions &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code ) {

            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case "ER_SUCCESS_MATCH":
                    slotValues[name] = {
                        "synonym": filledSlots[item].value,
                        "resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        "isValidated": filledSlots[item].value == filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name
                    };
                    break;
                case "ER_SUCCESS_NO_MATCH":
                    slotValues[name] = {
                        "synonym":filledSlots[item].value,
                        "resolved":filledSlots[item].value,
                        "isValidated":false
                    };
                    break;
                }
            } else {
                slotValues[name] = {
                    "synonym": filledSlots[item].value,
                    "resolved":filledSlots[item].value,
                    "isValidated": false
                };
            }
        },this);
        //console.log("slot values: "+JSON.stringify(slotValues));
        return slotValues;
}

//=========================================================================================================================================
// DATA
//=========================================================================================================================================

// Variables for speech
var one_second_break             = "<break time=\"1s\"/>";
var one_two_break                = "<break time=\"2s\"/>";
var one_three_break              = "<break time=\"3s\"/>";

// Audio files array for various sections of the skill.
var songs = {
    "intro": "https://s3.amazonaws.com/dailypledge/officialSkillSounds/opening_sound_official.mp3",
    "easy": "https://s3.amazonaws.com/asksounds/waitingtime1.mp3",
    "medium": "https://s3.amazonaws.com/asksounds/waitingtime3.mp3",
    "hard": "https://s3.amazonaws.com/asksounds/waitingtime2.mp3",
    "correct": "https://s3.amazonaws.com/asksounds/correct1.mp3",
    "focus_accepted": "https://s3.amazonaws.com/dailypledge/officialSkillSounds/accept_pledge_official.mp3"
};

// Let's keep things as dynamic as possible for giveing the focus.
// These phrases are used when introducing the focus for the first time.
// Array of focus intro phrases.
let focusIntroductionWords = [
    "Alright, here is your focus for today, it is called, ",
    "Ok. Here is your focus, it's called, ",
    "Your focus is called, ",
    "Ok great, here it is, it's called, "
];

// When a user askes for a new focus, let's change up the text.
// These phrases are used when a user asks to recieve a new focus because they didnt want the first one delivered.
// Array of phrases for giving a new focus.
let anotherFocusIntroductionWords = [
    "How about this one. It's called ",
    "Here is another. It's called ",
    "What about this. It's called ",
    "I have a new one for you. It's called "
];

// When a user agrees to do a focus, give some dynamic intro text.
// Array of focus confirmation introduction phrases.
let confirmFocusIntroductionWords = [
    "Ok great <break time=\"1s\"/> repeat after me with a confident and clear voice, ",
    "Fantastic <break time=\"1s\"/> repeat after me with a confident and clear voice, ",
    "Perfect <break time=\"1s\"/> repeat after me with a confident and clear voice, ",
    "Excellent <break time=\"1s\"/> repeat after me with a confident and clear voice, "
];

// Master list of core wellness pillars and their descriptions.
let wellnessPillarsArray = {
    "pillars": [
        {
            "id": 1,
            "name": "Social Wellness",
            "short_description": "The ability to relate to and connect with other people in our world. Our ability to establish and maintain positive relationships with family, friends and co-workers leads to Social Wellness.",
        },
        {
            "id": 2,
            "name": "Emotional Wellness",
            "short_description": "The ability to understand ourselves and cope with the challenges life can bring. The ability to acknowledge and share feelings of anger, fear, sadness or stress; hope, love, joy and happiness in a productive manner leads to Emotional Wellness.",
        },
        {
            "id": 3,
            "name": "Intellectual Wellness",
            "short_description": "The ability to open our minds to new ideas and experiences that can be applied to personal decisions, group interaction and community betterment. The desire to learn new concepts, improve skills and seek challenges in pursuit of lifelong learning leads to Intellectual Wellness.",
        },
        {
            "id": 4,
            "name": "Physical Wellness",
            "short_description": "The ability to maintain a healthy quality of life that allows us to get through our daily activities without fatigue or physical stress. The ability to recognize that our behaviors have a significant impact on our wellness and adopting healthful habits (routine check ups, a balanced diet, exercise, etc.) while avoiding destructive habits (tobacco, drugs, alcohol, etc.) will lead to optimal Physical Wellness.",
        },
        {
            "id": 5,
            "name": "Environmental Wellness",
            "short_description": "The ability to recognize our own responsibility for the quality of the air, the water and the land that surrounds us. The ability to make a positive impact on the quality of our environment, be it our homes, our communities or our planet contributes to our Environmental Wellness.",
        },
        {
            "id": 6,
            "name": "Occupational Wellness",
            "short_description": "The ability to get personal fulfillment from our jobs or our chosen career fields while still maintaining balance in our lives. Our desire to contribute in our careers to make a positive impact on the organizations we work in and to society as a whole leads to Occupational Wellness.",
        },
    ]
};
    


let focusArray = {
    "focuss": [
        {
            "id": 1,
            "name": "Sweet Tooth",
            "short_description": "Focus to eliminate sugary snacks and drinks from your diet. The amount of sugar in every day food is abnormally high and unnecessary. Start by looking at how much sugar is inside things you normally eat.",
            "reprompt_snippet": "watching your sugar intake?",
            "endsession_snippet": "reducing your sugar intake.",
            "focus_confirmation": "watch my sugar intake.",
            "examples": 
                {
                    "example_1": "Try having your coffee or tea without sugar. Or to start, try putting in a bit less. It doesnt take long before your brain to reset and you wont even miss it.",
                    "example_2": "This one is easy and it involves chocolate. If you are a chocolate lover, go for it dark. The darker the chocolate, the less sugar.",
                    "example_3": "If you can't eliminate all sugar, look for labels marked added sugar. That means sugar was added to sweeten food or drinks even more than it was naturally.",
                    "example_4": "Next time you have a craving for something sweet to drink, replace it with natural flavored water or a beverage with carbonation to give it a nice effect, you can even throw in a lime or lemon!."
                }
            ,
            "pillar": "Physical",
            "tag": ["diet", "health", "exercise"]
        },
        {
            "id": 2,
            "name": "Downward Facing Dog",
            "short_description": "Focus to take a yoga class. Did you know that Yoga works both the body and the mind? It increases total body awareness, improves flexibility and can help with lowering stress levels.",
            "reprompt_snippet": "taking a Yoga class?",
            "endsession_snippet": "taking a Yoga class.",
            "focus_confirmation": "take a Yoga class.",
            "examples": 
                {
                    "example_1": "Check out Yoga videos online, or stop by your local Yoga studio.",
                    "example_2": "Ask a friend if you can go with them to their class. They might have a free day pass or session you could use.",
                    "example_3": "Search for for beginner Yoga terms like Downward facing dog, or cat cow online.",
                    "example_4": "Check your local deal site for potential discounts on Yoga classes or memberships."
                }
            ,
            "pillar": "Physical",
            "tag": ["health", "relaxation", "yoga", "mind", "stress", "brain"]
        },
        {
            "id": 3,
            "name": "The Guru",
            "short_description": "Focus to learn about Meditation techniques. This is all about self mastery and control. How you breathe, how you think, how you are. Studies show meditation can reduce anxiety, stress and greaten your capacity to relax.",
            "reprompt_snippet": "taking a Meditation class?",
            "endsession_snippet": "taking a Meditation class.",
            "focus_confirmation": "take a Meditation class.",
            "examples": 
                {
                    "example_1": "Start easy. Sit for just 2 minutes at a time for one week. Increase your meditation to 5 minutes after one week.",
                    "example_2": "Try meditating at the same time every day. Specifically try in the morning. It would be a great way to start the day with a clear mind.",
                    "example_3": "Dont worry about the details. Focus on clearing your head, not how to do it. The main thing is to get comfortable.",
                    "example_4": "Focus on your breathing. Take in slow deep breaths and exale slowly. Focus on absolute relaxation."
                }
            ,
            "pillar": "Physical",
            "tag": ["health", "relaxation", "active", "exercise", "stress", "yoga", "mind"]
        },
        {
            "id": 4,
            "name": "Beach Body",
            "short_description": "Focus to keep your skin safe when out in the sun. Did you know 90% of skin aging comes from the sun? Keep your skin looking healthy by protecting it from the sun's UV rays. ",
            "reprompt_snippet": "keep your skin safe?",
            "endsession_snippet": "keep your skin safe.",
            "focus_confirmation": "keep your skin safe.",
            "examples": 
                {
                    "example_1": "",
                    "example_2": "",
                    "example_3": "",
                    "example_4": ""
                }
            ,
            "pillar": "Physical",
            "tag": ["health", "skin", "UV rays", "cancer", "sun", "body"]
        },
        {
            "id": 5,
            "name": "Good Posture",
            "short_description": "Focus to keep good posture. Did you know that in addition to the health issues associated with a sedentary lifestyle, bad posture can affect our health, mood, productivity, and even success.",
            "reprompt_snippet": "have better posture?",
            "endsession_snippet": "have better posture.",
            "focus_confirmation": "have better posture.",
            "examples": 
                {
                    "example_1": "",
                    "example_2": "",
                    "example_3": "",
                    "example_4": ""
                }
            ,
            "pillar": "Physical",
            "tag": ["health", "posture", "back", "pain", "stiff", "body"]
        },
        {
            "id": 6,
            "name": "Water Logged",
            "short_description": "Focus to drink more water and stay hydrated. Did you know water helps flush toxins out of your body, and the fewer toxins that come into contact with your colon, bladder, and other organs, the less chance that critical ailments can develop.",
            "reprompt_snippet": "drinking more water?",
            "endsession_snippet": "drinking more water.",
            "focus_confirmation": "drink more water.",
            "examples": 
                {
                    "example_1": "",
                    "example_2": "",
                    "example_3": "",
                    "example_4": ""
                }
            ,
            "pillar": "Physical",
            "tag": ["health", "hydration", "water", "thirst", "toxins"]
        }
    ]
};


// Template for a focus.
/*
{
    "id": 2,
    "name": "",
    "short_description": "",
    "reprompt_snippet": "",
    "endsession_snippet": "",
    "focus_confirmation": "",
    "examples": 
        {
            "example_1": "",
            "example_2": "",
            "example_3": "",
            "example_4": ""
        }
    ,
    "pillar": "",
    "tag": []
}
*/

// List of todos for this skill.
/*
    1. Persistance
        1. XX - Set up an intro for first time users.
        2. Save a users nickname or name.
        3. Don't repeat done focuss, or when finding a new one?
        4. Get a users zipcode to get the weather.
            1. Based on the weather near you, recommend certain things.
        5. Get the date.
            1. Based on the date (or day of the week) - possibly even time, give deeper reccommendations.
    2. Cards
        1. Display cards with product information with referral ID?
    3. Add 4 examples for each.
    4. Sources?
    5. Website?
    6. Blog
    7. Youtube Video?
    8. Speech
        1. XX - Make intro words dynamic. "Here's another..., How about this one..."
    9. Gamificaiton
        1. XX - Points for completing focus.
*/
