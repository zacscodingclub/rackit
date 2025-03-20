module ServerRacksHelper
  # Helper to create lighter/darker versions of hex colors for component visualization
  def adjust_color_lightness(hex_color, lightness_percent)
    return "#4F46E5" unless hex_color.present? && hex_color.start_with?('#')
    
    # Convert hex to RGB
    r = hex_color[1..2].hex
    g = hex_color[3..4].hex
    b = hex_color[5..6].hex
    
    # Simple lightness adjustment
    if lightness_percent > 50
      # Lighten (move toward white)
      factor = (lightness_percent - 50) / 50.0
      r = r + ((255 - r) * factor)
      g = g + ((255 - g) * factor)
      b = b + ((255 - b) * factor)
    else
      # Darken (move toward black)
      factor = (50 - lightness_percent) / 50.0
      r = r * (1 - factor)
      g = g * (1 - factor)
      b = b * (1 - factor)
    end
    
    # Convert back to hex
    "##{format('%02x', r.round)}#{format('%02x', g.round)}#{format('%02x', b.round)}"
  end
end
