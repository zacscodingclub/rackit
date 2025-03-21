module ComponentsHelper
  def sortable(column, title = nil)
    title ||= column.titleize
    direction = (column == @sort_column && @sort_direction == "asc") ? "desc" : "asc"
    css_class = column == @sort_column ? "text-blue-600 hover:text-blue-800" : "text-gray-700 dark:text-gray-300 hover:text-blue-600"
    icon = ""
    
    if column == @sort_column
      icon = @sort_direction == "asc" ? "↑" : "↓"
    end
    
    link_to "#{title} #{icon}".html_safe, { sort: column, direction: direction }, 
      class: "#{css_class} cursor-pointer no-underline font-bold"
  end
end
