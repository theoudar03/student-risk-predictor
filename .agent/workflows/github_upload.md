---
description: How to upload this project to GitHub
---

# Upload to GitHub

Follow these steps to upload your project to GitHub.

## 1. Create a Repository on GitHub

1. Go to [GitHub.com](https://github.com/new).
2. Log in if necessary.
3. **Repository Name**: Enter a name (e.g., `student-risk-predictor`).
4. **Public/Private**: Choose your preference.
5. **Initialize this repository with**: DO NOT check any boxes (no README, no .gitignore). We already have code.
6. Click **Create repository**.

## 2. Initialize Git locally

Run the following terminal commands in your project folder:

```powershell
# Initialize git
git init

# Add all files (respecting the .gitignore I just created)
git add .

# Commit changes
git commit -m "Initial commit"

# Rename branch to main
git branch -M main
```

## 3. Link and Push

Copy the details from the GitHub page you just created. It will look like this:

```powershell
# Replace URL with your actual GitHub repo URL
git remote add origin https://github.com/YOUR_USERNAME/student-risk-predictor.git

# Push code
git push -u origin main
```
