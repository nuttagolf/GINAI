
import React, { useState, useCallback, useEffect } from 'react';
import { PreferencesForm } from './components/PreferencesForm';
import { RecipeCard } from './components/RecipeCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ApiKeyChecker } from './components/ApiKeyChecker';
import { HealthArticleView } from './components/HealthArticleView';
import { generateRecipes, moderateText, generateHealthArticle } from './services/geminiService';
import type { Recipe, Preferences, HealthArticle } from './types';
import { CuisineOption, CookingTimeOption } from './types';
import { DEFAULT_SERVINGS, LOCAL_STORAGE_FAVORITES_KEY, ARTICLE_AUTHOR_NAME } from './constants';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences>({
    pantryItems: [],
    cuisine: CuisineOption.ANY,
    dietaryRestrictions: [],
    servings: DEFAULT_SERVINGS,
    cookingTime: CookingTimeOption.ANY,
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For recipes
  const [error, setError] = useState<string | null>(null); // For recipes
  
  const [currentArticle, setCurrentArticle] = useState<HealthArticle | null>(null);
  const [isArticleLoading, setIsArticleLoading] = useState<boolean>(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  
  // View states
  const [showFavoritesView, setShowFavoritesView] = useState<boolean>(false);
  const [showArticleView, setShowArticleView] = useState<boolean>(false);


  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      if (storedFavorites) {
        setFavoriteRecipes(JSON.parse(storedFavorites));
      }
    } catch (e) {
      console.error("Failed to load favorites from localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_FAVORITES_KEY); 
    }
  }, []);

  const saveFavoritesToLocalStorage = (updatedFavorites: Recipe[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage:", e);
      setError("ไม่สามารถบันทึกสูตรอาหารโปรดได้ อาจเนื่องมาจากพื้นที่จัดเก็บเต็ม");
    }
  };

  const handlePreferencesChange = useCallback((newPreferences: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const handleGenerateRecipes = useCallback(async () => {
    if (apiKeyMissing) {
      setError("API Key ยังไม่ได้ตั้งค่า โปรดตั้งค่าตัวแปรสภาพแวดล้อม API_KEY");
      return;
    }

    setError(null);
    setArticleError(null); 
    setRecipes([]);
    setShowArticleView(false); 
    setShowFavoritesView(false);


    if (preferences.pantryItems.length > 0) {
      setIsLoading(true); 
      try {
        const moderationResult = await moderateText(preferences.pantryItems.join(', '));
        if (moderationResult.isHarmful) {
          setError(`ค้นพบเนื้อหาที่ไม่เหมาะสมในรายการวัตถุดิบ: ${moderationResult.detectedCategories.join(', ')}. กรุณาแก้ไขและลองอีกครั้ง`);
          setIsLoading(false);
          return;
        }
      } catch (moderationError) {
        console.error("Error during content moderation:", moderationError);
        setError(moderationError instanceof Error ? `ข้อผิดพลาดในการตรวจสอบเนื้อหา: ${moderationError.message}` : "เกิดข้อผิดพลาดในการตรวจสอบเนื้อหา");
        setIsLoading(false);
        return;
      }
    } else {
        setIsLoading(true);
    }

    try {
      const generatedRecipes = await generateRecipes(preferences);
      setRecipes(generatedRecipes);
    } catch (err) {
      console.error("Error generating recipes:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุขณะดึงข้อมูลสูตรอาหาร โปรดตรวจสอบคอนโซลเพื่อดูรายละเอียด");
    } finally {
      setIsLoading(false);
    }
  }, [preferences, apiKeyMissing]);

  const toggleFavoriteRecipe = useCallback((recipeToToggle: Recipe) => {
    setFavoriteRecipes(prevFavorites => {
      const isAlreadyFavorite = prevFavorites.some(favRecipe => favRecipe.name === recipeToToggle.name);
      let updatedFavorites;
      if (isAlreadyFavorite) {
        updatedFavorites = prevFavorites.filter(favRecipe => favRecipe.name !== recipeToToggle.name);
      } else {
        updatedFavorites = [...prevFavorites, recipeToToggle];
      }
      saveFavoritesToLocalStorage(updatedFavorites);
      return updatedFavorites;
    });
  }, []);

  const isRecipeFavorite = useCallback((recipeName: string): boolean => {
    return favoriteRecipes.some(favRecipe => favRecipe.name === recipeName);
  }, [favoriteRecipes]);
  
  const handleFetchArticle = useCallback(async () => {
    if (apiKeyMissing) {
      setArticleError("API Key ยังไม่ได้ตั้งค่า ไม่สามารถโหลดบทความได้");
      return;
    }
    setIsArticleLoading(true);
    setArticleError(null);
    setError(null); 
    setShowFavoritesView(false); 
    setShowArticleView(true);

    try {
      const article = await generateHealthArticle();
      setCurrentArticle(article);
    } catch (err) {
      console.error("Error generating health article:", err);
      setArticleError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดบทความสุขภาพ");
      setCurrentArticle(null); 
    } finally {
      setIsArticleLoading(false);
    }
  }, [apiKeyMissing]);
  
  const recipesToDisplay = showFavoritesView ? favoriteRecipes : recipes;
  const currentViewIsRecipeRelated = !showArticleView;

  const getButtonClass = (isActive: boolean) => {
    const base = "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
    const disabledClass = (isLoading || isArticleLoading) ? 'cursor-not-allowed opacity-60' : '';
    if (isActive && !(isLoading || isArticleLoading)) {
      return `${base} bg-primary text-gray-50 shadow-lg ${disabledClass}`;
    }
    return `${base} bg-surface text-primary border border-primary/50 hover:bg-primary/10 ${disabledClass}`;
  };


  return (
    <div className="min-h-screen bg-bground flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-primary logo-font mb-3">อยากกินอะไร ถาม AI ดู</h1>
        <p className="text-xl text-neutral">
          {showArticleView && currentArticle ? "สาระสุขภาพดีกับ AI" : "ให้ AI เปลี่ยนวัตถุดิบในครัวของคุณให้เป็นมื้ออร่อยสุดสร้างสรรค์!"}
        </p>
      </header>

      <ApiKeyChecker apiKeyMissing={apiKeyMissing} />

      <div className={`w-full max-w-6xl grid grid-cols-1 ${currentViewIsRecipeRelated ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 lg:gap-10`}>
        {currentViewIsRecipeRelated && (
          <aside className="lg:col-span-1 bg-surface p-6 rounded-xl shadow-xl self-start sticky top-8">
            <PreferencesForm
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
              onSubmit={handleGenerateRecipes}
              isLoading={isLoading}
              apiKeyMissing={apiKeyMissing}
            />
          </aside>
        )}

        <main className={`${currentViewIsRecipeRelated ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setShowArticleView(false);
                setShowFavoritesView(false);
              }}
              disabled={isLoading || isArticleLoading}
              className={getButtonClass(!showFavoritesView && !showArticleView)}
              aria-pressed={!showFavoritesView && !showArticleView}
            >
              สร้างสูตรอาหาร
            </button>
            <button
              onClick={() => {
                setShowFavoritesView(true);
                setShowArticleView(false);
              }}
              disabled={isLoading || isArticleLoading}
              className={`${getButtonClass(showFavoritesView && !showArticleView)} flex items-center`}
              aria-pressed={showFavoritesView && !showArticleView}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              สูตรโปรด ({favoriteRecipes.length})
            </button>
            <button
              onClick={() => {
                if (!currentArticle && !isArticleLoading) { 
                    handleFetchArticle();
                } else {
                    setShowArticleView(true); 
                    setShowFavoritesView(false);
                    setError(null); 
                }
              }}
              disabled={isArticleLoading || isLoading}
              className={`${getButtonClass(showArticleView)} flex items-center`}
              aria-pressed={showArticleView}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM5 17a1 1 0 001.447.894l4-2A1 1 0 0011 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 005 7v10z" />
              </svg>
              บทความสุขภาพ
            </button>
          </div>

          {(isLoading && currentViewIsRecipeRelated) && (
            <div className="flex justify-center items-center h-96">
              <LoadingSpinner />
            </div>
          )}
          {(error && currentViewIsRecipeRelated) && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6" role="alert">
              <p className="font-bold text-lg">เกิดข้อผิดพลาด (สูตรอาหาร)</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          
          {(isArticleLoading && showArticleView) && (
             <div className="flex justify-center items-center h-96">
               <LoadingSpinner />
             </div>
          )}
          {(articleError && showArticleView) && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6" role="alert">
              <p className="font-bold text-lg">เกิดข้อผิดพลาด (บทความ)</p>
              <p className="mt-1">{articleError}</p>
              <button
                onClick={handleFetchArticle}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 transition-colors"
              >
                ลองโหลดบทความอีกครั้ง
              </button>
            </div>
          )}

          {/* Recipe View Content */}
          {currentViewIsRecipeRelated && !isLoading && !error && recipesToDisplay.length === 0 && (
            <div className="bg-surface p-8 rounded-xl shadow-xl text-center text-neutral">
              <img 
                src="https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80" 
                alt="วัตถุดิบทำอาหารหลากหลายสีสัน" 
                className="mt-4 rounded-lg mx-auto mb-6 w-full max-w-md object-cover h-64 shadow-md" 
              />
              <h2 className="text-2xl font-semibold text-textdark mb-2">
                {showFavoritesView ? "คุณยังไม่มีสูตรอาหารที่บันทึกไว้" : 
                 apiKeyMissing ? "จำเป็นต้องตั้งค่า API Key" : "เริ่มต้นการผจญภัยในครัวของคุณ!"}
              </h2>
              <p className="text-lg">
                {showFavoritesView ? "ลองสร้างสูตรอาหารแล้วกดปุ่มรูปหัวใจเพื่อบันทึกสิ!" : 
                 apiKeyMissing ? "โปรดตั้งค่า API Key เพื่อเริ่มใช้งาน" : "เพียงใส่วัตถุดิบที่คุณมี และให้ AI ช่วยสร้างสรรค์เมนูอร่อยๆ ที่เหมาะกับคุณ"}
              </p>
            </div>
          )}
          {currentViewIsRecipeRelated && !isLoading && recipesToDisplay.length > 0 && (
            <div className="space-y-8">
              {recipesToDisplay.map((recipe, index) => (
                <RecipeCard 
                  key={`${recipe.name}-${showFavoritesView ? 'fav' : 'gen'}-${index}`}
                  recipe={recipe}
                  onToggleFavorite={toggleFavoriteRecipe}
                  isFavorite={isRecipeFavorite(recipe.name)}
                />
              ))}
            </div>
          )}

          {/* Article View Content */}
          {showArticleView && !isArticleLoading && currentArticle && !articleError && (
            <HealthArticleView 
              article={currentArticle} 
              onReloadArticle={handleFetchArticle}
              isReloading={isArticleLoading}
            />
          )}
           {showArticleView && !isArticleLoading && !currentArticle && !articleError && (
             <div className="bg-surface p-8 rounded-xl shadow-xl text-center text-neutral">
              <img 
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80" 
                alt="สุขภาพและการออกกำลังกาย" 
                className="mt-4 rounded-lg mx-auto mb-6 w-full max-w-md object-cover h-64 shadow-md" 
              />
               <h2 className="text-2xl font-semibold text-textdark mb-2">
                {apiKeyMissing ? "จำเป็นต้องตั้งค่า API Key" : "โหลดบทความสุขภาพและฟิตเนส"}
               </h2>
               <p className="text-lg mb-4">
                {apiKeyMissing ? "โปรดตั้งค่า API Key เพื่ออ่านบทความ" : "คลิกปุ่มด้านล่างเพื่อให้ AI สร้างบทความสุขภาพที่น่าสนใจให้คุณอ่าน"}
               </p>
               {!apiKeyMissing && (
                <button
                    onClick={handleFetchArticle}
                    disabled={isArticleLoading}
                    className="px-6 py-3 bg-secondary text-white rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors duration-150 disabled:bg-slate-400"
                >
                    {isArticleLoading ? 'กำลังโหลด...' : 'โหลดบทความแรก'}
                </button>
               )}
             </div>
           )}

        </main>
      </div>
      <footer className="w-full max-w-6xl mt-16 pt-8 border-t border-gray-300/70 text-center text-xs text-neutral">
        <p>&copy; {new Date().getFullYear()} อยากกินอะไร ถาม AI ดู และสาระสุขภาพดี ขับเคลื่อนโดย Gemini API</p>
        <p>สร้างสรรค์สูตรอาหารและดูแลสุขภาพในแบบของคุณ</p>
      </footer>
    </div>
  );
};

export default App;