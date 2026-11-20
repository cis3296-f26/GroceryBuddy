from datetime import date, timedelta  # tools for dates and adding days

from inventory.models import FoodType  # our shelf-life table

# Label keys and names. These match src/data/dashboardItems.js so the dashboard and backend agree.
USE_TODAY = "useToday"
USE_SOON = "useSoon"
GOOD_FOR_NOW = "goodForNow"
PAST_ESTIMATE = "pastEstimate"

LABEL_NAMES = {
    USE_TODAY: "Use Today",
    USE_SOON: "Use Soon",
    GOOD_FOR_NOW: "Good for Now",
    PAST_ESTIMATE: "Past Estimate",
}

USE_SOON_DAYS = 3  # 1 to 3 days left counts as "Use Soon" (same as the dashboard)


def find_food_type(name):
    """Finds the FoodType that matches a grocery name, like "milk" or "Apple"."""
    clean_name = name.strip()  # remove extra spaces at the start and end
    food = FoodType.objects.filter(name__iexact=clean_name).first()  # exact match, ignoring capital letters
    if food is None:  # no exact match
        food = FoodType.objects.filter(name__iexact=clean_name + "s").first()  # try plural, so "apple" finds "Apples"
    return food  # the FoodType, or None if we don't know this food


def shelf_life_days(food_type, storage_location):
    """How many days a food lasts where it's stored. None means USDA has no number."""
    if storage_location == "fridge":
        return food_type.fridge_days
    if storage_location == "freezer":
        return food_type.freezer_days
    if storage_location == "pantry":
        return food_type.pantry_days
    return None  # unknown storage place


def get_use_by_date(item):
    """Returns (use-by date, is it an estimate?). The date is None if we can't tell."""
    if item.expiration_date:  # the student typed the package date
        return item.expiration_date, False  # use it, it's not an estimate

    food_type = find_food_type(item.name)  # look the food up in our shelf-life table
    if food_type is None:  # not one of our foods
        return None, False

    days = shelf_life_days(food_type, item.storage_location)  # days for fridge, freezer, or pantry
    if days is None:  # USDA has no number here, like milk in the fridge
        return None, False

    return item.purchase_date + timedelta(days=days), True  # purchase date + shelf life = estimate


def get_label(days_left):
    """Turns days left into a label key."""
    if days_left is None:  # no date at all, so do what the dashboard does now
        return GOOD_FOR_NOW
    if days_left < 0:  # the date already passed
        return PAST_ESTIMATE
    if days_left == 0:  # the date is today
        return USE_TODAY
    if days_left <= USE_SOON_DAYS:  # 1 to 3 days left
        return USE_SOON
    return GOOD_FOR_NOW  # 4 or more days left


def get_status(item, today=None):
    """Everything the dashboard needs to know about one grocery item."""
    if today is None:  # tests can pass in a pretend "today"
        today = date.today()  # otherwise use the real date

    use_by_date, is_estimate = get_use_by_date(item)  # step 1: find the date
    if use_by_date is None:  # no date we can use
        days_left = None
    else:
        days_left = (use_by_date - today).days  # step 2: count the days left

    label = get_label(days_left)  # step 3: pick the label
    return {
        "item": item,  # the grocery item itself
        "use_by_date": use_by_date,  # package date or estimate (or None)
        "is_estimate": is_estimate,  # True if we estimated the date
        "days_left": days_left,  # can be negative if it already passed
        "label": label,  # key like "useSoon"
        "label_name": LABEL_NAMES[label],  # words like "Use Soon"
    }


def sort_by_urgency(items, today=None):
    """Returns a status for each item, soonest use-by date first. Items with no date go last."""
    statuses = [get_status(item, today) for item in items]  # get a status for every item
    with_date = [s for s in statuses if s["use_by_date"] is not None]  # items we have a date for
    without_date = [s for s in statuses if s["use_by_date"] is None]  # items with no date
    with_date.sort(key=lambda s: s["use_by_date"])  # sort by date, earliest first
    return with_date + without_date  # dated items first, then the rest


def dashboard_summary(items, today=None):
    """Counts how many items have each label, for the top of the dashboard."""
    summary = {USE_TODAY: 0, USE_SOON: 0, GOOD_FOR_NOW: 0, PAST_ESTIMATE: 0}  # start every count at 0
    for item in items:  # go through each grocery
        label = get_status(item, today)["label"]  # find its label
        summary[label] += 1  # add one to that label's count
    summary["total"] = len(items)  # how many groceries in all
    return summary