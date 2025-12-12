from playwright.sync_api import sync_playwright

def verify_recipe_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile viewport as this is a PWA
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        # Navigate to home
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")

        # Click on Manage Foods/Ingredients (usually a gear or list icon, but let's look for text if possible, or assume URL)
        # The app structure seems to be: Dashboard, Meals, etc.
        # Let's try direct navigation to ManageFoods which might be at /manage-foods or similar if routed.
        # Checking App.tsx to find routes would be good, but I'll try to find the navigation button.
        # Based on file list, ManageFoods is a page.

        # Let's check the routes in App.tsx (I'll do this via file read first in a separate step if needed, but here I'll try to click)
        # Assuming there is a nav bar.

        # Actually, let's just go to /foods if that's the route, or look for text "Meus Alimentos" which is in the header of ManageFoods.
        # If I don't know the route, I'll try to find a link.

        # Let's try navigating to commonly used routes for such a page
        page.goto("http://localhost:5173/foods") # Guessing route

        # Check if we are on the right page
        try:
            page.get_by_text("Meus Alimentos").wait_for(timeout=2000)
        except:
             # If failed, maybe it's under settings or a main nav
             page.goto("http://localhost:5173/settings")
             # Or maybe it's just on the main dashboard?
             # Let's print the page content if we fail.
             pass

        # If we are on ManageFoods:
        # Click "Nova Receita" (Chef Hat)
        page.get_by_title("Nova Receita").click()

        # Fill name
        page.get_by_placeholder("Ex: Torta de Frango").fill("Bolo de Teste")

        # Add an ingredient (Need to type in search)
        page.get_by_placeholder("Buscar ingrediente...").fill("Ovo")
        # Wait for results
        page.wait_for_timeout(1000)
        # Click first result
        page.locator(".cursor-pointer").first.click()

        # Verify the new mode toggle exists
        page.get_by_text("Calcular por:").wait_for()

        # Click "Porções / Unidades"
        page.get_by_text("Porções / Unidades").click()

        # Check input for portions appears
        page.get_by_placeholder("Ex: 8").fill("10")

        # Take screenshot of the form with "Portions" selected
        page.screenshot(path="verification/recipe_portions_ui.png")

        browser.close()

if __name__ == "__main__":
    verify_recipe_feature()
